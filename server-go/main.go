package main

import (
	"compress/gzip"
	"embed"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Version info (set during build)
var (
	Version   = "1.0.0"
	BuildTime = "unknown"
)

// Configuration
type Config struct {
	Port            string
	Host            string
	StaticDir       string
	EnableGzip      bool
	EnableCache     bool
	CacheMaxAge     int
	EnableLogging   bool
	EnableEmbedded  bool
}

// Embedded files (optional - for single binary distribution)
//go:embed public/*
var embeddedFS embed.FS

// Gzip response writer
type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

// Gzip writer pool for performance
var gzipWriterPool = sync.Pool{
	New: func() interface{} {
		return gzip.NewWriter(nil)
	},
}

// Logger middleware
func loggerMiddleware(next http.Handler, enabled bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !enabled {
			next.ServeHTTP(w, r)
			return
		}

		start := time.Now()
		
		// Create response wrapper to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(rw, r)
		
		duration := time.Since(start)
		log.Printf("%s %s %d %v", r.Method, r.URL.Path, rw.statusCode, duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Gzip middleware
func gzipMiddleware(next http.Handler, enabled bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !enabled {
			next.ServeHTTP(w, r)
			return
		}

		// Check if client accepts gzip
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		// Skip gzip for small files and already compressed content
		ext := filepath.Ext(r.URL.Path)
		skipGzip := map[string]bool{
			".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
			".webp": true, ".ico": true, ".woff": true, ".woff2": true,
			".mp4": true, ".webm": true, ".zip": true, ".gz": true,
		}
		if skipGzip[ext] {
			next.ServeHTTP(w, r)
			return
		}

		// Get gzip writer from pool
		gz := gzipWriterPool.Get().(*gzip.Writer)
		defer gzipWriterPool.Put(gz)
		
		gz.Reset(w)
		defer gz.Close()

		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Del("Content-Length")
		
		next.ServeHTTP(gzipResponseWriter{Writer: gz, ResponseWriter: w}, r)
	})
}

// Cache control middleware
func cacheMiddleware(next http.Handler, enabled bool, maxAge int) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !enabled {
			next.ServeHTTP(w, r)
			return
		}

		ext := filepath.Ext(r.URL.Path)
		
		// Different cache policies for different file types
		switch ext {
		case ".html":
			// No cache for HTML (SPA needs fresh content)
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
		case ".js", ".css":
			// Long cache for hashed assets
			if strings.Contains(r.URL.Path, "/assets/") {
				w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, immutable", maxAge))
			} else {
				w.Header().Set("Cache-Control", "public, max-age=3600")
			}
		case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico":
			// Medium cache for images
			w.Header().Set("Cache-Control", "public, max-age=86400")
		case ".woff", ".woff2", ".ttf", ".eot":
			// Long cache for fonts
			w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", maxAge))
		default:
			w.Header().Set("Cache-Control", "public, max-age=3600")
		}

		next.ServeHTTP(w, r)
	})
}

// Security headers middleware
func securityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Permissions Policy for camera app
		w.Header().Set("Permissions-Policy", "camera=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)")
		
		next.ServeHTTP(w, r)
	})
}

// SPA file server with fallback to index.html
type spaHandler struct {
	staticPath string
	indexPath  string
	fileSystem http.FileSystem
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Clean the path
	path := filepath.Clean(r.URL.Path)
	if path == "/" {
		path = "/index.html"
	}

	// Try to open the file
	f, err := h.fileSystem.Open(path)
	if err != nil {
		// File not found, serve index.html for SPA routing
		if os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
			return
		}
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer f.Close()

	// Get file info
	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// If it's a directory, try to serve index.html from it
	if stat.IsDir() {
		indexFile := filepath.Join(path, "index.html")
		if _, err := h.fileSystem.Open(indexFile); err == nil {
			path = indexFile
		} else {
			// Serve root index.html for SPA
			http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
			return
		}
	}

	// Set correct MIME type
	ext := filepath.Ext(path)
	mimeType := mime.TypeByExtension(ext)
	if mimeType != "" {
		w.Header().Set("Content-Type", mimeType)
	}

	// Serve the file
	http.ServeFile(w, r, filepath.Join(h.staticPath, path))
}

// Embedded SPA handler for single binary distribution
type embeddedSpaHandler struct {
	fileSystem fs.FS
	indexData  []byte
}

func (h embeddedSpaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
	if path == "" || path == "." {
		path = "index.html"
	}

	// Try to open the file from embedded FS
	file, err := h.fileSystem.Open(path)
	if err != nil {
		// Serve index.html for SPA routing
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(h.indexData)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil || stat.IsDir() {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(h.indexData)
		return
	}

	// Set MIME type
	ext := filepath.Ext(path)
	mimeType := mime.TypeByExtension(ext)
	if mimeType != "" {
		w.Header().Set("Content-Type", mimeType)
	}

	// Copy file content
	io.Copy(w, file)
}

func main() {
	// Parse command line flags
	config := Config{}
	
	flag.StringVar(&config.Port, "port", getEnv("PORT", "5000"), "Server port")
	flag.StringVar(&config.Host, "host", getEnv("HOST", "0.0.0.0"), "Server host")
	flag.StringVar(&config.StaticDir, "static", getEnv("STATIC_DIR", "./public"), "Static files directory")
	flag.BoolVar(&config.EnableGzip, "gzip", true, "Enable gzip compression")
	flag.BoolVar(&config.EnableCache, "cache", true, "Enable cache headers")
	flag.IntVar(&config.CacheMaxAge, "cache-max-age", 31536000, "Cache max age in seconds (default: 1 year)")
	flag.BoolVar(&config.EnableLogging, "logging", true, "Enable request logging")
	flag.BoolVar(&config.EnableEmbedded, "embedded", false, "Use embedded files (single binary mode)")
	
	showVersion := flag.Bool("version", false, "Show version")
	flag.Parse()

	if *showVersion {
		fmt.Printf("Camera ZeroDay Server v%s (built: %s)\n", Version, BuildTime)
		os.Exit(0)
	}

	// Create handler
	var handler http.Handler

	if config.EnableEmbedded {
		// Use embedded filesystem
		subFS, err := fs.Sub(embeddedFS, "public")
		if err != nil {
			log.Fatal("Failed to access embedded files:", err)
		}
		
		// Read index.html for SPA fallback
		indexData, err := fs.ReadFile(embeddedFS, "public/index.html")
		if err != nil {
			log.Fatal("Failed to read embedded index.html:", err)
		}
		
		handler = embeddedSpaHandler{
			fileSystem: subFS,
			indexData:  indexData,
		}
		log.Println("Using embedded files mode")
	} else {
		// Check if static directory exists
		if _, err := os.Stat(config.StaticDir); os.IsNotExist(err) {
			log.Fatalf("Static directory not found: %s", config.StaticDir)
		}

		handler = spaHandler{
			staticPath: config.StaticDir,
			indexPath:  "index.html",
			fileSystem: http.Dir(config.StaticDir),
		}
		log.Printf("Serving files from: %s", config.StaticDir)
	}

	// Apply middleware chain
	handler = securityMiddleware(handler)
	handler = cacheMiddleware(handler, config.EnableCache, config.CacheMaxAge)
	handler = gzipMiddleware(handler, config.EnableGzip)
	handler = loggerMiddleware(handler, config.EnableLogging)

	// Create server with timeouts
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", config.Host, config.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	log.Printf("Camera ZeroDay Server v%s", Version)
	log.Printf("Listening on %s:%s", config.Host, config.Port)
	log.Printf("Gzip: %v, Cache: %v, Logging: %v", config.EnableGzip, config.EnableCache, config.EnableLogging)
	
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
