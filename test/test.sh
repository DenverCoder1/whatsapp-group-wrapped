#!/bin/bash
# Quick test script - run tests and show results

cd "$(dirname "$0")/.."
node test/run-tests.js
