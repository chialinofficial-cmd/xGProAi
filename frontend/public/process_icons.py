from PIL import Image
import os

def process_icons():
    source_path = "source_icon.jpg"
    if not os.path.exists(source_path):
        print("Source icon not found!")
        return

    img = Image.open(source_path)
    
    # 1. Favicon (32x32)
    img.resize((32, 32), Image.Resampling.LANCZOS).save("favicon.ico")
    
    # 2. Apple Touch Icon (180x180)
    img.resize((180, 180), Image.Resampling.LANCZOS).save("apple-touch-icon.png")
    
    # 3. Android Chrome (192x192)
    img.resize((192, 192), Image.Resampling.LANCZOS).save("android-chrome-192x192.png")
    
    # 4. Android Chrome (512x512)
    img.resize((512, 512), Image.Resampling.LANCZOS).save("android-chrome-512x512.png")
    
    # 5. Generic Icon (512x512)
    img.resize((512, 512), Image.Resampling.LANCZOS).save("icon.png")

    print("Icons generated successfully!")

if __name__ == "__main__":
    process_icons()
