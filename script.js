const terminalDiv = document.getElementById("terminal");

let pendingHandler = null;

let undoStack = [];
let redoStack = [];

let activeInput = null;

function focusInput() {
	if (!activeInput) return;

	activeInput.focus();

	const range = document.createRange();
	const sel = window.getSelection();
	range.selectNodeContents(activeInput);
	range.collapse(false);
	sel.removeAllRanges();
	sel.addRange(range);
}

document.addEventListener("mousedown", () => {
	setTimeout(focusInput, 0);
});

function newLine() {
    undoStack = []; redoStack = [];
	const line = document.createElement("div");
	line.className = "line";

	const prompt = document.createElement("span");
	prompt.className = "prompt";
	prompt.textContent = "~$";

	const input = document.createElement("span");
	input.className = "input";
	input.contentEditable = true;

	line.appendChild(prompt);
	line.appendChild(input);
	terminalDiv.appendChild(line);

	activeInput = input;
	focusInput();

	input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const cmd = input.textContent.trim();

            input.contentEditable = false;

            if (pendingHandler) {
                const handler = pendingHandler;
                pendingHandler = null;
                handler(cmd);
                input.contentEditable = false;
                newLine();
                return;
            }

            run(cmd);
            newLine();
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (undoStack.length > 0) {
                redoStack.push(input.textContent);
                input.textContent = undoStack.pop();
                focusInput();
            }
        }

        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            if (redoStack.length > 0) {
                undoStack.push(input.textContent);
                input.textContent = redoStack.pop();
                focusInput();
            }
        }

        else if (!e.ctrlKey && !e.metaKey && e.key !== "Enter") {
            undoStack.push(input.textContent);
            redoStack = [];
        }
    });
}

function renderColoredLine(container, text) {
	const regex = /\[color=(#[0-9a-fA-F]{3,6}|[a-zA-Z]+|rgb\([^)]+\)|hsl\([^)]+\))\](.*?)\[\/color\]/g;

	let lastIndex = 0;
	let match;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			container.appendChild(
				document.createTextNode(text.slice(lastIndex, match.index))
			);
		}

		const span = document.createElement("span");
		span.textContent = match[2];
		span.style.color = match[1];
		container.appendChild(span);

		lastIndex = regex.lastIndex;
	}

	if (lastIndex < text.length) {
		container.appendChild(
			document.createTextNode(text.slice(lastIndex))
		);
	}
}

function print(text) {
	const lines = text.split("\n");

	for (const lineText of lines) {
		const lineDiv = document.createElement("div");
		renderColoredLine(lineDiv, lineText);
		terminalDiv.appendChild(lineDiv);
	}
}

function printInline(text) {
	let last = terminalDiv.lastElementChild;

	if (!last || last.className === "line") {
		last = document.createElement("div");
		terminalDiv.appendChild(last);
	}

	last.innerHTML = "";
	renderColoredLine(last, text);
}

const context = {
	console: {
		log: (...args) => print(`${args.map(String).join(" ")}`),
		warn: (...args) => print("Warning: " + args.map(String).join(" ")),
		error: (...args) => print("Error: " + args.map(String).join(" "))
	}
};

function startLoader(message = "Loading") {
	const frames = ["|", "/", "-", "\\"];
	let i = 0;
	let running = true;

	const interval = setInterval(() => {
		printInline(`[color=#a1a1a1]${message} ${frames[i++ % frames.length]}[/color]`);
	}, 120);

	return function stop(text) {
		clearInterval(interval);
		running = false;
		if (text) print(text);
	};
}

/* persistent variables/functions here */
const predefFunctions = [
    "console", 
    "scope", 
    "help", 
    "unset", 
    "unsetAll", 
    "reload", 
    "clear"
];

const predefConstants = [
    "PI"
]

run(`
console.log(
"██████╗\\u00A0██╗\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0███████╗██╗\\u00A0\\u00A0██╗\\n██╔══██╗██║\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0██╔════╝██║\\u00A0\\u00A0██║\\n██████╔╝██║\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0█████╗\\u00A0\\u00A0███████║\\n██╔══██╗██║\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0██╔══╝\\u00A0\\u00A0██╔══██║\\n██████╔╝███████╗███████╗██║\\u00A0\\u00A0██║\\n╚═════╝\\u00A0╚══════╝╚══════╝╚═╝\\u00A0\\u00A0╚═╝\\n\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0\\u00A0"
);
    console.log(\`[color=#a1a1a1]Instance started at: \${Date()}[/color]
    
    Type [[color=#ffa1a1]help()[/color]] for a list of commands.
    \`);
`);

context.PI = Math.PI;

context.help = function() {
    run(`
        console.log();
        console.log("Functions:");
        for(let i = 0; i < predefFunctions.length; i++) {console.log(\`[color=#a1a1a1]\${i+1}.[/color] \${predefFunctions[i]}\`)};
        console.log();
        console.log("Constants:");
        for(let i = 0; i < predefConstants.length; i++) {console.log(\`[color=#a1a1a1]\${i+1}.[/color] \${predefConstants[i]}\`)};
        console.log();
        context.unset("i", false); 
    `)
}

context.unset = function(name, visible) {
    if (context.hasOwnProperty(name)) {
        delete context[name];
        if (visible) {print(`Variable '${name}' removed.`)};
    } else {
        print(`Variable '${name}' does not exist.`);
    }
}

context.unsetAll = function() {
    const keys = Object.keys(context).filter(k => !predefFunctions.includes(k) && !predefConstants.includes(k));
    if (keys.length === 0) {
        print("[color=#a1a1a1]No user-defined variables.[/color]")
        return;
    }
    let i;
    for (i = 0; i < keys.length; i++) {
        context.unset(keys[i]);
        print(`${keys[i]} -> 🗑︎`);
    }
    print(`${i} [color=#a1a1a1]assignment(s) removed from scope.[/color]`);
}

context.reload = function() {
	print("[color=#ffa1a1]Really reload?[/color] [color=#a1a1a1](y/n)[/color]");

	pendingHandler = function(answer) {
		if (answer.toLowerCase() === "y") {
			const stop = startLoader("Reloading");

			setTimeout(() => {
				stop("");
				window.location.reload();
			}, 1200);
		} else {
			print("[color=#a1a1a1]Cancelled.[/color]");
		}
	};
}

context.clear = function() {
    terminalDiv.innerHTML = "";
}

context.scope = function() {
    const keys = Object.keys(context).filter(k => !predefFunctions.includes(k) && !predefConstants.includes(k));
    if (keys.length === 0) {
        print("[color=#a1a1a1]No user-defined variables.[/color]");
        return;
    }
    for (const key of keys) {
        let value;
        try {
            value = context[key];
        } catch {
            value = "[unavailable]";
        }
        print(`${key} [color=#a1a1a1]=[/color] ${value}`);
    }
}

function normalize(cmd) {
	return cmd.replace(
		/\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g,
		"context.$2"
	);
}

function run(cmd) {
	if (!cmd) return;

	try {
		cmd = normalize(cmd);

		let result;

		try {
			result = Function(
				"context",
				"with (context) { return (" + cmd + ") }"
			)(context);
		} catch {
			result = Function(
				"context",
				"with (context) { " + cmd + " }"
			)(context);
		}

		if (result !== undefined) {
			print(`[color=#a1a1a1]${String(result)}[/color]`);
		}
	} catch (err) {
		print(`[color=#ffa1a1]${err.toString()}[/color]`);
	}
}

newLine();