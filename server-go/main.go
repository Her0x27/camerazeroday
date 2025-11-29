package main

import (
        "compress/gzip"
        "flag"
        "fmt"
        "io"
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
        Port          string
        Host          string
        StaticDir     string
        EnableGzip    bool
        EnableCache   bool
        CacheMaxAge   int
        EnableLogging bool
}

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

// Response writer wrapper to capture status code
type responseWriter struct {
        http.ResponseWriter
        statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
        rw.statusCode = code
        rw.ResponseWriter.WriteHeader(code)
}

// Logger middleware
func loggerMiddleware(next http.Handler, enabled bool) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                if !enabled {
                        next.ServeHTTP(w, r)
                        return
                }

                start := time.Now()
                rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
                next.ServeHTTP(rw, r)
                duration := time.Since(start)
                
                log.Printf("%s %s %d %v", r.Method, r.URL.Path, rw.statusCode, duration)
        })
}

// Gzip middleware
func gzipMiddleware(next http.Handler, enabled bool) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                if !enabled {
                        next.ServeHTTP(w, r)
                        return
                }

                if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
                        next.ServeHTTP(w, r)
                        return
                }

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

                switch ext {
                case ".html", "":
                        w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
                        w.Header().Set("Pragma", "no-cache")
                        w.Header().Set("Expires", "0")
                case ".js", ".css":
                        if strings.Contains(r.URL.Path, "/assets/") {
                                w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, immutable", maxAge))
                        } else {
                                w.Header().Set("Cache-Control", "public, max-age=3600")
                        }
                case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico":
                        w.Header().Set("Cache-Control", "public, max-age=86400")
                case ".woff", ".woff2", ".ttf", ".eot":
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
                w.Header().Set("X-Content-Type-Options", "nosniff")
                w.Header().Set("X-Frame-Options", "DENY")
                w.Header().Set("X-XSS-Protection", "1; mode=block")
                w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
                w.Header().Set("Permissions-Policy", "camera=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)")

                next.ServeHTTP(w, r)
        })
}

// SPA handler with fallback to index.html
type spaHandler struct {
        staticPath string
        indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
        // Security: Clean and sanitize the path to prevent directory traversal
        requestPath := filepath.Clean(r.URL.Path)
        
        // Remove leading slashes (both forward and OS-specific) to make it relative
        requestPath = strings.TrimPrefix(requestPath, "/")
        requestPath = strings.TrimPrefix(requestPath, string(filepath.Separator))
        
        // If empty or root, serve index.html
        if requestPath == "" || requestPath == "." || requestPath == string(filepath.Separator) {
                http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
                return
        }
        
        // Build the full path
        fullPath := filepath.Join(h.staticPath, requestPath)
        
        // Security: Verify the path is still within staticPath (prevent traversal attacks)
        // filepath.Rel returns an error if the path escapes the base
        relPath, err := filepath.Rel(h.staticPath, fullPath)
        if err != nil || strings.HasPrefix(relPath, "..") || filepath.IsAbs(relPath) {
                // Path traversal attempt detected - serve 403
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
        }

        // Check if file exists
        fi, err := os.Stat(fullPath)
        if os.IsNotExist(err) {
                // SPA fallback for non-existent files
                http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
                return
        }
        
        if err != nil {
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
                return
        }
        
        // Handle directories
        if fi.IsDir() {
                indexFile := filepath.Join(fullPath, "index.html")
                if _, err := os.Stat(indexFile); err == nil {
                        fullPath = indexFile
                } else {
                        // SPA fallback for directories without index.html
                        http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
                        return
                }
        }

        // Set correct MIME type
        ext := filepath.Ext(fullPath)
        mimeType := mime.TypeByExtension(ext)
        if mimeType != "" {
                w.Header().Set("Content-Type", mimeType)
        }

        http.ServeFile(w, r, fullPath)
}

func main() {
        config := Config{}

        flag.StringVar(&config.Port, "port", getEnv("PORT", "5000"), "Server port")
        flag.StringVar(&config.Host, "host", getEnv("HOST", "0.0.0.0"), "Server host")
        flag.StringVar(&config.StaticDir, "static", getEnv("STATIC_DIR", "./public"), "Static files directory")
        flag.BoolVar(&config.EnableGzip, "gzip", true, "Enable gzip compression")
        flag.BoolVar(&config.EnableCache, "cache", true, "Enable cache headers")
        flag.IntVar(&config.CacheMaxAge, "cache-max-age", 31536000, "Cache max age in seconds")
        flag.BoolVar(&config.EnableLogging, "logging", true, "Enable request logging")

        showVersion := flag.Bool("version", false, "Show version")
        flag.Parse()

        if *showVersion {
                fmt.Printf("Camera ZeroDay Server v%s (built: %s)\n", Version, BuildTime)
                os.Exit(0)
        }

        // Resolve static directory to absolute path
        staticDir, err := filepath.Abs(config.StaticDir)
        if err != nil {
                log.Fatalf("Invalid static directory: %v", err)
        }

        // Check if static directory exists
        if _, err := os.Stat(staticDir); os.IsNotExist(err) {
                log.Fatalf("Static directory not found: %s", staticDir)
        }

        // Check if index.html exists
        indexPath := filepath.Join(staticDir, "index.html")
        if _, err := os.Stat(indexPath); os.IsNotExist(err) {
                log.Fatalf("index.html not found in: %s", staticDir)
        }

        handler := spaHandler{
                staticPath: staticDir,
                indexPath:  "index.html",
        }

        // Apply middleware chain
        var h http.Handler = handler
        h = securityMiddleware(h)
        h = cacheMiddleware(h, config.EnableCache, config.CacheMaxAge)
        h = gzipMiddleware(h, config.EnableGzip)
        h = loggerMiddleware(h, config.EnableLogging)

        // Create server with timeouts
        server := &http.Server{
                Addr:         fmt.Sprintf("%s:%s", config.Host, config.Port),
                Handler:      h,
                ReadTimeout:  15 * time.Second,
                WriteTimeout: 15 * time.Second,
                IdleTimeout:  60 * time.Second,
        }

        log.Printf("Camera ZeroDay Server v%s", Version)
        log.Printf("Serving files from: %s", staticDir)
        log.Printf("Listening on %s:%s", config.Host, config.Port)
        log.Printf("Gzip: %v | Cache: %v | Logging: %v", config.EnableGzip, config.EnableCache, config.EnableLogging)

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
