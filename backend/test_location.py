#!/usr/bin/env python3
"""
Test script to add sample location data for testing the map visualization.
This creates test location data so you can see markers on the map.

Usage:
1. Get your child_id from the database or API
2. Run: python3 test_location.py <child_id> <latitude> <longitude>
   Example: python3 test_location.py bae0e5e9-a277-4283-aab1-c54ed19913ba 37.7749 -122.4194
"""

import sys
import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"

def get_auth_token(email, password):
    """Login and get JWT token"""
    response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.text}")
        return None

def create_location(token, child_id, latitude, longitude, accuracy=10.0):
    """Create a location update"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    location_data = {
        "child_id": child_id,
        "latitude": float(latitude),
        "longitude": float(longitude),
        "accuracy": accuracy
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/locations",
        headers=headers,
        json=location_data
    )
    
    if response.status_code == 201:
        print(f"✅ Location created successfully!")
        print(f"   Child ID: {child_id}")
        print(f"   Location: {latitude}, {longitude}")
        return True
    else:
        print(f"❌ Failed to create location: {response.text}")
        return False

def get_children(token):
    """Get list of children"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{API_BASE_URL}/api/children",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get children: {response.text}")
        return []

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_location.py <email> <password> [child_id] [latitude] [longitude]")
        print("\nExample:")
        print("  python3 test_location.py user@example.com password123")
        print("  python3 test_location.py user@example.com password123 bae0e5e9-a277-4283-aab1-c54ed19913ba 37.7749 -122.4194")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    # Login
    print("🔐 Logging in...")
    token = get_auth_token(email, password)
    if not token:
        sys.exit(1)
    
    print("✅ Logged in successfully!\n")
    
    # Get children
    print("📋 Fetching children...")
    children = get_children(token)
    
    if not children:
        print("❌ No children found. Please create a child profile first.")
        sys.exit(1)
    
    print(f"✅ Found {len(children)} child(ren):\n")
    for i, child in enumerate(children, 1):
        print(f"  {i}. {child['name']} (Age: {child['age']})")
        print(f"     ID: {child['child_id']}")
        print()
    
    # Use provided child_id or first child
    if len(sys.argv) >= 4:
        child_id = sys.argv[3]
        latitude = float(sys.argv[4]) if len(sys.argv) >= 5 else 37.7749
        longitude = float(sys.argv[5]) if len(sys.argv) >= 6 else -122.4194
    else:
        # Use first child with default location (San Francisco)
        child_id = children[0]['child_id']
        latitude = 37.7749
        longitude = -122.4194
        print(f"📍 Using first child: {children[0]['name']}")
        print(f"📍 Using default location: San Francisco ({latitude}, {longitude})")
        print(f"   (You can specify custom location: python3 test_location.py {email} {password} {child_id} <lat> <lng>)\n")
    
    # Create location
    print(f"📍 Creating location update...")
    create_location(token, child_id, latitude, longitude)
    
    print("\n✅ Done! Check the map on http://localhost:5173/dashboard")

if __name__ == "__main__":
    main()

