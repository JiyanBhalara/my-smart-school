#!/usr/bin/env python3
import argparse
import internetarchive
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--identifier', required=True, help='Internet Archive identifier to delete')
    args = parser.parse_args()

    try:
        # Get the item from Internet Archive
        item = internetarchive.get_item(args.identifier)
        
        if item.exists:
            # Delete the item
            result = item.delete(
                cascade_delete=True,  # Delete all files
                verbose=True
            )
            
            if result:
                print(f"Successfully deleted {args.identifier} from Internet Archive")
                sys.exit(0)
            else:
                print(f"Failed to delete {args.identifier}")
                sys.exit(1)
        else:
            print(f"Item {args.identifier} not found on Internet Archive")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error deleting from Internet Archive: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
