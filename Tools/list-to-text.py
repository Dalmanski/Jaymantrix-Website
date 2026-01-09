print("Enter your list (example: [\"hi\", \"hello\", \"kya\"]):")

text_input = input()

items = eval(text_input)

print("\nConverted text:")
for item in items:
    print(item)
