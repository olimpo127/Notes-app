#!/bin/bash

# Define paths
frontend_path="./frontend/notes-app"
backend_path="./backend"

# Function to set up backend
setup_backend() {
    cd $backend_path || exit

    # Activate pipenv shell and execute python app.py in the background
    pipenv run python app.py &

    cd ..
}

# Function to set up frontend
setup_frontend() {
    cd $frontend_path || exit

    # Install npm dependencies and start the app
    npm start

    cd ..
}

# Function to run the app
run_app() {
    echo "Setting up backend..."
    setup_backend

    echo "Setting up frontend..."
    setup_frontend
}

# Execute the script
run_app

