# Command: {{Command Name}}

> **IMPORTANT**: {{A brief description of important information about the command - its purpose, specific usage notes, etc.}}

## Purpose

{{1-2 paragraphs explaining the purpose and value of the command}}

## Prerequisites

Before executing this command, ensure you have:

1. [ ] {{Prerequisite 1}}
2. [ ] {{Prerequisite 2}}
3. [ ] {{Prerequisite 3}}
4. [ ] Obtained the current date for proper document timestamping
5. [ ] Verified access to the project's configuration file (../config.json)

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] {{Step 1}}
- [ ] {{Step 2}}
- [ ] {{Step 3}}
- [ ] Validate results
- [ ] Update related documentation

## Step 1: {{Name of First Step}}

{{Detailed description of the first step}}

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Read project configuration to access paths
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# {{Optional code/command to execute}}
{{bash-command}}
```

## Step 2: {{Name of Second Step}}

{{Detailed description of the second step}}

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# {{Command example}}
```

## Step 3: {{Name of Third Step}}

{{Detailed description of the third step}}

## Examples

### Basic Example

```bash
# Get current date
date +%Y-%m-%d
# Output: 2025-03-19

# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# {{Example of simple command usage}}
```

### Advanced Example

{{Description of a more complex example usage}}

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# {{Example of more complex command usage}}
```

## Common Issues and Solutions

| Issue       | Solution       |
| ----------- | -------------- |
| {{Issue 1}} | {{Solution 1}} |
| {{Issue 2}} | {{Solution 2}} |
| {{Issue 3}} | {{Solution 3}} |

## Related Documents

- [{{Related document name}}]({{path_to_document}})
- [{{Related document name}}]({{path_to_document}})

---

**Last Updated**: {{YYYY-MM-DD}}
