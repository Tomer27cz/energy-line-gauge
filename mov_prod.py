import shutil
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def copy_file():
    source_file = os.path.join("dist", "energy-line-gauge.js")
    destination_path = os.environ.get("DESTINATION_PATH")

    if not destination_path:
        print("Error: DESTINATION_PATH environment variable is not set.")
        sys.exit(1)

    if not os.path.isfile(source_file):
        print(f"Error: Source file '{source_file}' does not exist.")
        sys.exit(1)

    if not os.path.isdir(destination_path):
        try:
            os.makedirs(destination_path)
            print(f"Created missing destination directory: {destination_path}")
        except OSError as e:
            print(f"Error creating destination directory '{destination_path}': {e}")
            sys.exit(1)

    try:
        destination_file = os.path.join(destination_path, "energy-line-gauge.js")
        shutil.copy2(source_file, destination_file)
        print(f"File copied successfully to {destination_file}")
    except (shutil.Error, IOError) as e:
        print(f"Error copying file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    copy_file()