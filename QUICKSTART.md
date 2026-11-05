# Quick start (IU ISE FlyRig team)

The rest of this repo's README is for a different project (a museum kiosk
framework this app happens to be built on). Ignore it. This is all you need.

## First time only

```bash
git clone https://github.com/eazziz/CCIS-2020-011-FlyRig.git
cd CCIS-2020-011-FlyRig
./setup.sh
```

`setup.sh` installs everything required (ffmpeg, a Node/Python environment,
app dependencies) and clones the data repo to `~/IU-ISE-FlyRig-Files`. It
asks for your Mac password if it needs to install Homebrew/ffmpeg - that's
normal.

## Every time you want to record

```bash
conda activate flyrig
npm start
```

Fill in Operator, Run Type, and Save Location (a plain folder like
`~/FlyRigRecordings`, not inside this project folder), then Record.

When you stop recording, the app automatically:
1. Adds the run to the data repo (`~/IU-ISE-FlyRig-Files`)
2. Commits and pushes it to GitHub

No git commands needed. If you see a message that pushing failed, the
recording is still saved safely on your computer - just ask for help.
