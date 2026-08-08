GPT-SoVITS Installation Guide for Apple Silicon (M4)

This guide will walk you through setting up GPT-SoVITS on your MacBook. We will use the Terminal to install everything.

Pro Tip: Open your "Terminal" app (you can find it by pressing Cmd + Space and typing "Terminal"). Copy and paste these commands one by one, hitting Enter after each.

Step 1: Install System Prerequisites

First, we need to install Apple's developer tools and FFmpeg (the software that handles audio processing).

Install Xcode Command Line Tools:

xcode-select --install


(A pop-up will appear asking you to install. Click "Install" and wait for it to finish).

Install Homebrew (The Mac Package Manager):
If you don't already have Homebrew, run this command:

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"


Install FFmpeg:

brew install ffmpeg


Step 2: Install Conda (Python Environment Manager)

AI tools require specific versions of Python to run without crashing. We will use Miniconda to create an isolated "bubble" for GPT-SoVITS.

Install Miniconda:

brew install --cask miniconda


Initialize Conda for your Terminal:

conda init zsh


(After running this, completely close your Terminal window and open a new one so the changes take effect).

Step 3: Download GPT-SoVITS

Now we will download the actual open-source software from GitHub.

Clone the repository:

git clone https://github.com/RVC-Boss/GPT-SoVITS.git


Move into the newly downloaded folder:

cd GPT-SoVITS


Step 4: Setup the AI Environment

We are going to create our Python 3.9 "bubble" and install all the required AI libraries.

Create the environment:

conda create -n GPTSoVits python=3.9 -y


Activate the environment:

conda activate GPTSoVits


(You should now see (GPTSoVits) at the beginning of your terminal prompt).

Install the dependencies:

pip install -r requirements.txt


(This step will take a few minutes as it downloads PyTorch and other large AI libraries).

Step 5: Launching the Software

You are done with the setup! Whenever you want to use GPT-SoVITS in the future, you just need to open your Terminal and run these three commands:

Go to the folder:

cd GPT-SoVITS


Activate your environment:

conda activate GPTSoVits


Start the Web Interface:

python webui.py


After running python webui.py, you will see a local web address appear in the terminal (usually http://127.0.0.1:9874). Open that link in your browser (Chrome or Safari) to access the GPT-SoVITS interface!




