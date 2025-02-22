#!/bin/bash

set -e

# Clear existing data
cleanup() {
    echo "Cleaning up existing data..."

    rm -rf ~/.osmosisd1
    rm -rf ~/.osmosisd2

    pkill -f "osmosisd" || true
    sleep 2
}

cleanup