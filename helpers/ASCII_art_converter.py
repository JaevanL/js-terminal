def replace_ascii_art():
    print("Enter your ASCII art (finish with an empty line):")
    
    lines = []
    while True:
        line = input()
        if line == "":
            break
        lines.append(line)

    art = "\n".join(lines)

    space_replace = input("Replace spaces with: ")
    newline_replace = input("Replace newlines with: ")

    art = art.replace(" ", space_replace)

    art = art.replace("\n", newline_replace)

    print("\nASCII art:\n")
    print(art)

    js_string = art.replace('"', '\\"')
    print("\nJS version:\n")
    print(f'"{js_string}"')

if __name__ == "__main__":

    replace_ascii_art()
