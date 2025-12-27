import shutil
import os
import sys
import datetime
import json

# This is really dumb, but it works for now
#
# Just replacing the file on the server with the new one
# This script is used to copy the energy-line-gauge.js file to the Home Assistant community folder
# and replace the version string in the file with the current date and time

def check_languages():
    print("\nChecking languages...")

    any_missing_keys = False
    any_additional_keys = False

    # check what languages are in "src/localize/languages" folder
    languages = []
    for file in os.listdir("src/localize/languages"):
        if file.endswith(".json"):
            languages.append(file[:-5])

    # compare with the "en.json" file
    # compare the keys for each language, print out how many keys are missing and in what languages

    with open("src/localize/languages/en.json", "r", encoding="utf-8") as f:
        en_data = json.load(f)
        en_keys = set(en_data.keys())

    for lang in languages:
        if lang == "en":
            continue
        with open(f"src/localize/languages/{lang}.json", "r", encoding="utf-8") as f:
            lang_data = json.load(f)
            lang_keys = set(lang_data.keys())

            missing_keys = en_keys - lang_keys
            additional_keys = lang_keys - en_keys

            if missing_keys:
                any_missing_keys = True
                print(f"Language '{lang}' is missing {len(missing_keys)} keys: {missing_keys}")

            if additional_keys:
                any_additional_keys = True
                print(f"Language '{lang}' has {len(additional_keys)} additional keys: {additional_keys}")

            if not missing_keys and not additional_keys:
                print(f"Language '{lang}' has all keys.")

    with open(f"src/localize/defaults.json", "r", encoding="utf-8") as f:
        lang_data = json.load(f)
        lang_keys = set(lang_data.keys())

        missing_keys = en_keys - lang_keys
        additional_keys = lang_keys - en_keys

        if missing_keys:
            any_missing_keys = True
            print(f"Defaults missing {len(missing_keys)} keys: {missing_keys}")

        if additional_keys:
            any_additional_keys = True
            print(f"Defaults have {len(additional_keys)} additional keys: {additional_keys}")

        if not missing_keys and not additional_keys:
            print(f"Defaults have all keys.")

    if any_missing_keys:
        print("\nMISSING KEYS, PLEASE FIX!", file=sys.stderr)
        override = input("Continue anyway? (y/n): ")
        if override.lower() != 'y':
            sys.exit(1)
        print("Continuing anyway...\n")
    elif any_additional_keys:
        print("\nADDITIONAL KEYS, PLEASE FIX!", file=sys.stderr)
        override = input("Continue anyway? (y/n): ")
        if override.lower() != 'y':
            sys.exit(1)
        print("Continuing anyway...\n")
    else:
        print("Language check COMPLETE.\n")

def replace_and_copy(source_path, dest_path, old_string, new_string):
    try:
        # Read the source content
        with open(source_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Perform replacement if the string exists
        if old_string in content:
            content = content.replace(old_string, new_string)
            # KEEPING PRINT STATEMENT THE SAME:
            print(f"\nSuccessfully replaced '{old_string}' with '{new_string}' in {source_path}\n")

        # Write to destination
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # KEEPING PRINT STATEMENT THE SAME:
        print(f"File copied successfully to {dest_path}")

    except FileNotFoundError:
        # KEEPING PRINT STATEMENT THE SAME:
        print(f"The file {source_path} was not found.")
    except Exception as e:
        # KEEPING PRINT STATEMENT THE SAME:
        print(f"An error occurred: {e}", file=sys.stderr)

def copy_build_files():
    dist_dir = "dist"
    # Destination path from your original file
    destination_path = r'Z:\opt\homeassistant\config\www\community\energy-line-gauge'

    if not os.path.isdir(dist_dir):
        # ADAPTED PRINT STATEMENT (Original referred to a single file):
        print(f"Error: Source directory '{dist_dir}' does not exist.", file=sys.stderr)
        sys.exit(1)

    if not os.path.isdir(destination_path):
        try:
            os.makedirs(destination_path)
            # KEEPING PRINT STATEMENT THE SAME:
            print(f"Created missing destination directory: {destination_path}")
        except OSError as e:
            # KEEPING PRINT STATEMENT THE SAME:
            print(f"Error creating destination directory '{destination_path}': {e}", file=sys.stderr)
            sys.exit(1)

    # Clean old .js files in destination to avoid clutter from old hashes
    print("Cleaning old .js files in destination...")
    for filename in os.listdir(destination_path):
        if filename.endswith(".js") or filename.endswith(".map"):
            try:
                os.remove(os.path.join(destination_path, filename))
            except Exception as e:
                print(f"Warning: Could not remove old file {filename}: {e}", file=sys.stderr)

    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    search_string = "%c ENERGY LINE GAUGE"
    replace_string = current_time + " %c ENERGY LINE GAUGE"

    # Iterate over all files in dist folder
    files_processed = 0
    for filename in os.listdir(dist_dir):
        source_file = os.path.join(dist_dir, filename)
        destination_file = os.path.join(destination_path, filename)

        if os.path.isfile(source_file):
            files_processed += 1
            if filename.endswith(".js"):
                # Use the smart copy that replaces the timestamp
                replace_and_copy(source_file, destination_file, search_string, replace_string)
            else:
                # Direct copy for assets/maps
                try:
                    shutil.copy2(source_file, destination_file)
                    print(f"File copied successfully to {destination_file}")
                except Exception as e:
                    print(f"An error occurred: {e}", file=sys.stderr)

    if files_processed == 0:
        print(f"Error: No files found in '{dist_dir}'.", file=sys.stderr)

if __name__ == "__main__":
    check_languages()
    copy_build_files()