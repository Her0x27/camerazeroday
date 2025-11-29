#!/bin/bash

# Camera ZeroDay - Build Script
# Usage: ./build.sh [options]
# Options:
#   --obfuscate    Enable JavaScript obfuscation/scrambling
#   --clean        Clean dist folder before build
#   --help         Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
OBFUSCATE=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
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
            echo "  --obfuscate    Enable JavaScript obfuscation/scrambling"
            echo "  --clean        Clean dist folder before build"
            echo "  --help         Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./build.sh                    # Standard build"
            echo "  ./build.sh --obfuscate        # Build with obfuscation"
            echo "  ./build.sh --clean --obfuscate # Clean build with obfuscation"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Camera ZeroDay - Production Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Clean (optional)
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[1/4] Cleaning dist folder...${NC}"
    rm -rf dist
    echo -e "${GREEN}      Done!${NC}"
else
    echo -e "${YELLOW}[1/4] Skipping clean (use --clean to enable)${NC}"
fi

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[2/4] Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}      Done!${NC}"
else
    echo -e "${YELLOW}[2/4] Dependencies already installed${NC}"
fi

# Step 3: Run the main build
echo -e "${YELLOW}[3/4] Building application...${NC}"
echo "      Building client (Vite)..."
echo "      Building server (esbuild)..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}      Build completed!${NC}"

# Step 4: Obfuscation (optional)
if [ "$OBFUSCATE" = true ]; then
    echo -e "${YELLOW}[4/4] Obfuscating JavaScript files...${NC}"
    
    # Check if javascript-obfuscator is installed
    if ! command -v javascript-obfuscator &> /dev/null; then
        echo "      Installing javascript-obfuscator..."
        npm install -g javascript-obfuscator 2>/dev/null || npx javascript-obfuscator --version > /dev/null 2>&1
    fi
    
    # Obfuscate client JavaScript files
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
        echo -e "${GREEN}      Obfuscation completed!${NC}"
    else
        echo -e "${YELLOW}      No JS files found to obfuscate${NC}"
    fi
else
    echo -e "${YELLOW}[4/4] Skipping obfuscation (use --obfuscate to enable)${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Build completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Output files:"
echo "  - dist/public/   (frontend assets)"
echo "  - dist/index.cjs (server bundle)"
echo ""
echo "To start the production server:"
echo "  npm run start"
echo ""
echo "Or manually:"
echo "  NODE_ENV=production node dist/index.cjs"
echo ""

# Show build size
if [ -d "dist" ]; then
    echo "Build size:"
    du -sh dist/public 2>/dev/null || true
    du -sh dist/index.cjs 2>/dev/null || true
fi
