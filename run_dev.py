#!/usr/bin/env python3
"""
Development script to run both frontend and backend concurrently.
"""

import subprocess
import sys
import os
import signal
import time
from pathlib import Path

# Get the project root directory (where this script is located)
PROJECT_ROOT = Path(__file__).parent.absolute()
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_DIR = PROJECT_ROOT / "backend"

# Store process references for cleanup
processes = []


def cleanup_processes():
    """Kill all spawned processes on exit."""
    print("\n🛑 Shutting down services...")
    for process in processes:
        if process.poll() is None:  # Process is still running
            print(f"   Terminating process {process.pid}...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"   Force killing process {process.pid}...")
                process.kill()
                process.wait()
    print("✅ All services stopped.")


def signal_handler(sig, frame):
    """Handle interrupt signals (Ctrl+C)."""
    cleanup_processes()
    sys.exit(0)


def run_frontend():
    """Run the Next.js frontend development server."""
    print("🚀 Starting frontend (Next.js)...")
    print(f"   Directory: {FRONTEND_DIR}")
    
    if not FRONTEND_DIR.exists():
        print(f"❌ Error: Frontend directory not found at {FRONTEND_DIR}")
        return None
    
    # Check if node_modules exists, if not, suggest npm install
    if not (FRONTEND_DIR / "node_modules").exists():
        print("⚠️  Warning: node_modules not found. Run 'npm install' in frontend/ first.")
    
    try:
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        return process
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return None


def run_backend():
    """Run the orphiq backend server."""
    print("🚀 Starting backend (Orphiq)...")
    print(f"   Directory: {BACKEND_DIR}")
    
    if not BACKEND_DIR.exists():
        print(f"❌ Error: Backend directory not found at {BACKEND_DIR}")
        return None
    
    # Check if cli.py exists
    cli_path = BACKEND_DIR / "cli.py"
    if not cli_path.exists():
        print(f"❌ Error: cli.py not found at {cli_path}")
        return None
    
    try:
        # Run python cli.py run (command 3 is 'run')
        process = subprocess.Popen(
            ["python", "cli.py", "run"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        return process
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None


def print_output(process, prefix):
    """Print output from a process with a prefix."""
    if process is None:
        return
    
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line.rstrip()}")
            if process.poll() is not None:
                break
    except Exception as e:
        print(f"[{prefix}] Error reading output: {e}")


def main():
    """Main function to run both services."""
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("=" * 60)
    print("🎭 Vaidol Development Server")
    print("=" * 60)
    print()
    
    # Start frontend
    frontend_process = run_frontend()
    if frontend_process:
        processes.append(frontend_process)
        print(f"   ✅ Frontend started (PID: {frontend_process.pid})")
        print(f"   📍 Frontend will be available at http://localhost:3000")
    else:
        print("   ❌ Failed to start frontend")
        cleanup_processes()
        sys.exit(1)
    
    print()
    
    # Start backend
    backend_process = run_backend()
    if backend_process:
        processes.append(backend_process)
        print(f"   ✅ Backend started (PID: {backend_process.pid})")
        print(f"   📍 Backend WebSocket: ws://localhost:12393/client-ws")
    else:
        print("   ❌ Failed to start backend")
        cleanup_processes()
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✅ Both services are running!")
    print("   Press Ctrl+C to stop all services")
    print("=" * 60)
    print()
    
    # Monitor processes and print output
    try:
        import threading
        
        # Create threads to print output from each process
        frontend_thread = threading.Thread(
            target=print_output,
            args=(frontend_process, "FRONTEND"),
            daemon=True
        )
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, "BACKEND"),
            daemon=True
        )
        
        frontend_thread.start()
        backend_thread.start()
        
        # Wait for processes to complete
        while True:
            # Check if processes are still running
            if frontend_process.poll() is not None:
                print("\n⚠️  Frontend process ended")
                break
            if backend_process.poll() is not None:
                print("\n⚠️  Backend process ended")
                break
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        pass
    finally:
        cleanup_processes()


if __name__ == "__main__":
    main()

