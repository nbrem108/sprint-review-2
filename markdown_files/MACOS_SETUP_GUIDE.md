# macOS Setup Guide for Private GitHub Repository

This guide will help you set up the sprint review generator project on macOS, specifically for private GitHub repositories.

## Prerequisites

Before starting, make sure you have:
- A GitHub account with access to the private repository
- Administrator privileges on your Mac
- Terminal access (Applications → Utilities → Terminal)

## Step 1: Install Required Tools

### Install Homebrew (Package Manager)
If you don't have Homebrew installed, run this command:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, you may need to add Homebrew to your PATH. Follow the instructions that appear in the terminal.

### Install Node.js and npm
```bash
# Install Node.js (includes npm)
brew install node

# Verify installation
node --version
npm --version
```

### Install Git
```bash
# Install Git
brew install git

# Configure Git with your information
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## Step 2: GitHub Authentication

You have two options for authenticating with GitHub:

### Option A: GitHub CLI (Recommended - Easiest)

```bash
# Install GitHub CLI
brew install gh

# Authenticate with GitHub
gh auth login
```

Follow the prompts:
1. Choose "GitHub.com"
2. Choose "HTTPS"
3. Choose "Yes" to authenticate Git operations
4. Choose "Login with a web browser"
5. Copy the one-time code and press Enter
6. Your browser will open - paste the code and authorize

### Option B: Personal Access Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Mac Setup"
4. Select scopes: `repo` (this gives access to private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

## Step 3: Clone the Repository

### Using GitHub CLI (if you used Option A):
```bash
# Navigate to where you want the project
cd ~/Desktop  # or wherever you prefer

# Clone the repository
gh repo clone yourusername/sr-2_0_final

# Navigate into the project directory
cd sr-2_0_final
```

### Using Git directly (if you used Option B):
```bash
# Navigate to where you want the project
cd ~/Desktop  # or wherever you prefer

# Clone the repository
git clone https://github.com/yourusername/sr-2_0_final.git

# Navigate into the project directory
cd sr-2_0_final
```

**Note:** If prompted for a password, use the personal access token (not your GitHub password).

## Step 4: Install Dependencies

```bash
# Install all npm dependencies
npm install
```

This may take a few minutes as it downloads all the required packages.

## Step 5: Fix Common Permission Issues

If you encounter permission errors, run these commands:

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# If using Homebrew's Node.js
sudo chown -R $(whoami) $(brew --prefix)/lib/node_modules
```

## Step 6: Run the Development Server

```bash
# Start the development server
npm run dev
```

The application should now be running at `http://localhost:3000`

## Troubleshooting

### SSL/Certificate Errors
```bash
# Update certificates
brew install ca-certificates
```

### Network Issues
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### Git Authentication Issues
```bash
# Check your git configuration
git config --global user.name
git config --global user.email

# If you need to update them:
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Alternative: SSH Setup (Advanced)
If you prefer SSH over HTTPS:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Copy the output
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste the key and save

Clone using SSH:
```bash
git clone git@github.com:yourusername/sr-2_0_final.git
```

## Common Error Messages and Solutions

### "Repository not found"
- Make sure you have access to the private repository
- Verify the repository URL is correct
- Ensure you're authenticated with GitHub

### "Permission denied"
- Run the permission fix commands in Step 5
- Make sure you're using the correct authentication method

### "npm ERR! code ENOENT"
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### "GitHub API rate limit exceeded"
- Wait a few minutes and try again
- If using a personal access token, make sure it has the correct permissions

## Next Steps

Once everything is set up:
1. The development server should be running at `http://localhost:3000`
2. You can start developing and making changes
3. Changes will automatically reload in the browser

## Need Help?

If you encounter any issues not covered in this guide:
1. Check the error message carefully
2. Try the troubleshooting steps above
3. Make sure all prerequisites are installed correctly
4. Verify your GitHub authentication is working

---

**Note:** Replace `yourusername` with the actual GitHub username who owns the repository, and update the email and name fields with your actual information. 