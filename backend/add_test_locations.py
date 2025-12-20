"""
Script to add test location data for children
Run this script to populate test locations for screenshots
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models.location import Location
from app.models.child import Child
from app.models.user import User, Parent
from app.redis_client import set_location
from sqlalchemy.orm import Session
from sqlalchemy import desc

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def add_test_locations():
    """Add test location data for all children"""
    db = SessionLocal()
    
    try:
        # Get all parents and their children
        parents = db.query(Parent).all()
        
        if not parents:
            print("No parents found. Please create a parent account first.")
            return
        
        print(f"Found {len(parents)} parent(s)")
        
        # Get all children
        children = db.query(Child).filter(Child.is_active == True).all()
        
        if not children:
            print("No children found. Please create children first.")
            return
        
        print(f"Found {len(children)} child(ren)")
        
        # Base coordinates (San Francisco area)
        base_lat = 37.7749
        base_lon = -122.4194
        
        # Generate locations for each child
        for child in children:
            print(f"\nAdding test locations for {child.name} (ID: {child.child_id})...")
            
            # Delete existing test locations (optional - comment out if you want to keep existing)
            existing = db.query(Location).filter(Location.child_id == child.child_id).all()
            if existing:
                print(f"  Found {len(existing)} existing locations, keeping them...")
            
            # Generate locations for the last 24 hours (one every 30 minutes = 48 locations)
            locations_added = 0
            now = datetime.utcnow()
            
            for i in range(48):
                # Time goes back from now
                timestamp = now - timedelta(minutes=i * 30)
                
                # Create a path that moves around (simulating movement)
                # Add some random variation to simulate real movement
                lat_offset = random.uniform(-0.01, 0.01) * (i / 10)  # Gradually move
                lon_offset = random.uniform(-0.01, 0.01) * (i / 10)
                
                # Add some circular movement pattern
                angle = (i * 30) * 3.14159 / 180  # Convert to radians
                lat_offset += 0.005 * (i % 20) / 20 * random.uniform(-1, 1)
                lon_offset += 0.005 * (i % 20) / 20 * random.uniform(-1, 1)
                
                location = Location(
                    child_id=child.child_id,
                    latitude=base_lat + lat_offset,
                    longitude=base_lon + lon_offset,
                    accuracy=random.uniform(5, 25),  # 5-25 meters accuracy
                    address=f"Test Location {i+1}",
                    timestamp=timestamp
                )
                
                db.add(location)
                locations_added += 1
            
            # Also add a current location (most recent)
            current_location = Location(
                child_id=child.child_id,
                latitude=base_lat + random.uniform(-0.005, 0.005),
                longitude=base_lon + random.uniform(-0.005, 0.005),
                accuracy=random.uniform(5, 15),
                address="Current Location",
                timestamp=now
            )
            db.add(current_location)
            db.flush()  # Flush to get the location_id
            locations_added += 1
            
            # Cache the current location in Redis
            location_cache = {
                "location_id": str(current_location.location_id),
                "child_id": str(current_location.child_id),
                "child_name": child.name,
                "latitude": current_location.latitude,
                "longitude": current_location.longitude,
                "accuracy": current_location.accuracy,
                "address": current_location.address,
                "timestamp": current_location.timestamp.isoformat()
            }
            set_location(str(child.child_id), location_cache, ttl=300)
            
            print(f"  Added {locations_added} test locations for {child.name}")
            print(f"  Cached latest location in Redis")
        
        # Commit all changes
        db.commit()
        print(f"\n✅ Successfully added test locations for {len(children)} child(ren)")
        print(f"   Total locations: {locations_added * len(children)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Adding Test Location Data")
    print("=" * 60)
    add_test_locations()
    print("=" * 60)

