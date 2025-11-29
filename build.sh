#!/bin/bash

# Camera ZeroDay - Build Script
# Usage: ./build.sh [options]
# Options:
#   --go           Build Go server instead of Node.js
#   --embedded     Embed static files into Go binary (single file distribution)
#   --obfuscate    Enable JavaScript obfuscation/scrambling
#   --clean        Clean dist folder before build
#   --help         Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default options
USE_GO=false
EMBEDDED=false
OBFUSCATE=false
CLEAN=false

# Version info
VERSION="1.0.0"
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S_UTC')

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --go)
            USE_GO=true
            shift
            ;;
        --embedded)
            EMBEDDED=true
            USE_GO=true  # Embedded implies Go
            shift
            ;;
        --obfuscate)
            OBFUSCATE=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            echo "Camera ZeroDay - Build Script"
            echo ""
            echo "Usage: ./build.sh [options]"
            echo ""
            echo "Options:"
            echo "  --go           Build Go server instead of Node.js"
            echo "  --embedded     Embed static files into Go binary (single file)"
            echo "  --obfuscate    Enable JavaScript obfuscation/scrambling"
            echo "  --clean        Clean dist folder before build"
            echo "  --help         Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./build.sh                    # Node.js build"
            echo "  ./build.sh --go               # Go server build"
            echo "  ./build.sh --go --embedded    # Single Go binary with embedded files"
            echo "  ./build.sh --go --obfuscate   # Go build with JS obfuscation"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${CYAN}Camera ZeroDay - Production Build${BLUE}     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ "$USE_GO" = true ]; then
    echo -e "${CYAN}Mode: Go Server${NC}"
    if [ "$EMBEDDED" = true ]; then
        echo -e "${CYAN}Type: Single Binary (embedded files)${NC}"
    else
        echo -e "${CYAN}Type: Separate binary + static files${NC}"
    fi
else
    echo -e "${CYAN}Mode: Node.js Server${NC}"
fi
echo ""

# Step 1: Clean (optional)
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[1/5] Cleaning dist folder...${NC}"
    rm -rf dist
    echo -e "${GREEN}      ✓ Done${NC}"
else
    echo -e "${YELLOW}[1/5] Skipping clean (use --clean to enable)${NC}"
fi

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}      ✓ Done${NC}"
else
    echo -e "${YELLOW}[2/5] Dependencies already installed${NC}"
fi

# Step 3: Build frontend with Vite
echo -e "${YELLOW}[3/5] Building frontend (Vite)...${NC}"
mkdir -p dist

# Run Vite build
npx vite build --config vite.config.ts

if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ Frontend build completed${NC}"

# Step 4: Obfuscation (optional)
if [ "$OBFUSCATE" = true ]; then
    echo -e "${YELLOW}[4/5] Obfuscating JavaScript files...${NC}"
    
    JS_FILES=$(find dist/public/assets -name "*.js" 2>/dev/null || true)
    
    if [ -n "$JS_FILES" ]; then
        for file in $JS_FILES; do
            echo "      Obfuscating: $(basename $file)"
            npx javascript-obfuscator "$file" \
                --output "$file" \
                --compact true \
                --control-flow-flattening true \
                --control-flow-flattening-threshold 0.5 \
                --dead-code-injection false \
                --debug-protection false \
                --disable-console-output false \
                --identifier-names-generator hexadecimal \
                --rename-globals false \
                --self-defending false \
                --simplify true \
                --split-strings false \
                --string-array true \
                --string-array-encoding base64 \
                --string-array-threshold 0.5 \
                --unicode-escape-sequence false
        done
        echo -e "${GREEN}      ✓ Obfuscation completed${NC}"
    else
        echo -e "${YELLOW}      No JS files found to obfuscate${NC}"
    fi
else
    echo -e "${YELLOW}[4/5] Skipping obfuscation (use --obfuscate to enable)${NC}"
fi

# Step 5: Build server
if [ "$USE_GO" = true ]; then
    echo -e "${YELLOW}[5/5] Building Go server...${NC}"
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        echo -e "${RED}Go is not installed. Please install Go first.${NC}"
        exit 1
    fi
    
    cd server-go
    
    # Build flags
    LDFLAGS="-s -w -X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME}"
    
    if [ "$EMBEDDED" = true ]; then
        echo "      Building with embedded files..."
        
        # Copy public files to server-go for embedding
        rm -rf public
        cp -r ../dist/public .
        
        # Build with embedded files
        CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o ../dist/server main.go
        
        # Clean up copied files
        rm -rf public
        
        # Remove separate public folder since it's embedded
        rm -rf ../dist/public
        
        echo -e "${GREEN}      ✓ Single binary with embedded files created${NC}"
    else
        # Build without embedding
        CGO_ENABLED=0 go build -ldflags="${LDFLAGS}" -o ../dist/server main.go
        echo -e "${GREEN}      ✓ Go server binary created${NC}"
    fi
    
    cd ..
    
    # Create run script
    if [ "$EMBEDDED" = true ]; then
        cat > dist/run.sh << 'EOF'
#!/bin/bash
./server --embedded "$@"
EOF
    else
        cat > dist/run.sh << 'EOF'
#!/bin/bash
./server --static ./public "$@"
EOF
    fi
    chmod +x dist/run.sh
    
else
    echo -e "${YELLOW}[5/5] Building Node.js server...${NC}"
    
    # Build server with esbuild
    npx esbuild server/index.ts \
        --platform=node \
        --bundle \
        --format=cjs \
        --outfile=dist/index.cjs \
        --define:process.env.NODE_ENV=\"production\" \
        --minify \
        --external:@neondatabase/serverless \
        --external:ws \
        --external:bufferutil \
        --external:utf-8-validate
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Server build failed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}      ✓ Node.js server build completed${NC}"
    
    # Create run script
    cat > dist/run.sh << 'EOF'
#!/bin/bash
NODE_ENV=production node index.cjs "$@"
EOF
    chmod +x dist/run.sh
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${GREEN}Build completed successfully!${BLUE}         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Output files:"
ls -lh dist/ 2>/dev/null | tail -n +2 | while read line; do
    echo "  $line"
done

if [ -d "dist/public" ]; then
    echo ""
    echo "Public folder:"
    du -sh dist/public 2>/dev/null | awk '{print "  Total size: " $1}'
fi

echo ""
echo "To start the server:"
if [ "$USE_GO" = true ]; then
    if [ "$EMBEDDED" = true ]; then
        echo "  cd dist && ./server --embedded"
        echo "  or: cd dist && ./run.sh"
    else
        echo "  cd dist && ./server --static ./public"
        echo "  or: cd dist && ./run.sh"
    fi
else
    echo "  npm run start"
    echo "  or: cd dist && node index.cjs"
fi
echo ""
echo "Server options (Go only):"
echo "  --port PORT       Set server port (default: 5000)"
echo "  --host HOST       Set server host (default: 0.0.0.0)"
echo "  --gzip=false      Disable gzip compression"
echo "  --cache=false     Disable cache headers"
echo "  --logging=false   Disable request logging"
echo ""
