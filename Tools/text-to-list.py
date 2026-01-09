print("Enter your text, enter empty to OK:")

items = []

while True:
    text = input()
    if text == "":
        break
    items.append(text)

print("\nYour list formatted:")
print("[" + ", ".join(f'"{item}"' for item in items) + "]")
