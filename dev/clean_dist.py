import shutil
import os

def clean_dist():
    dist_path = 'dist'
    if os.path.exists(dist_path):
        print(f"Deleting {dist_path} folder...")
        shutil.rmtree(dist_path)
    else:
        print("Dist folder does not exist, skipping clean.")

if __name__ == "__main__":
    clean_dist()