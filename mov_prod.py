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
            if missing_keys:
                any_missing_keys = True
                print(f"Language '{lang}' is missing {len(missing_keys)} keys: {missing_keys}")
            else:
                print(f"Language '{lang}' has all keys.")

    if any_missing_keys:
        print("\nMISSING KEYS, PLEASE FIX!")
        override = input("Continue anyway? (y/n): ")
        if override.lower() != 'y':
            sys.exit(1)
        print("Continuing anyway...\n")
    else:
        print("Language check COMPLETE.\n")

def replace_string_in_file(file_path, old_string, new_string):
    try:
        # Open the file in read mode and read its content
        with open(file_path, 'r', encoding='utf-8') as file:
            file_content = file.read()

        # Replace the old string with the new string
        updated_content = file_content.replace(old_string, new_string)

        # Open the file in write mode and overwrite the content with the updated content
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)

        print(f"Successfully replaced '{old_string}' with '{new_string}' in {file_path}")
    except FileNotFoundError:
        print(f"The file {file_path} was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

def copy_file():
    source_file = os.path.join("dist", "energy-line-gauge.js")
    destination_path = r'Z:\opt\homeassistant\config\www\community\energy-line-gauge'

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

    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Replace the version string in the file
    replace_string_in_file(source_file, "%c ENERGY LINE GAUGE", current_time + " %c ENERGY LINE GAUGE")

    try:
        destination_file = os.path.join(destination_path, "energy-line-gauge.js")
        shutil.copy2(source_file, destination_file)
        print(f"File copied successfully to {destination_file}")
    except (shutil.Error, IOError) as e:
        print(f"Error copying file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    check_languages()
    copy_file()