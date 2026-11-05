const os = require('os');
const path = require('path');

module.exports = {
  showDevTools: false,
  io: {
    manufacturer: 'Silicon Labs',
  },
  // Local clone of https://github.com/eazziz/IU-ISE-FlyRig-Files, used to
  // auto-add each recording via its scripts/add_run.py. Override here if
  // your clone lives somewhere else.
  dataRepoPath: path.join(os.homedir(), 'IU-ISE-FlyRig-Files'),
  pythonPath: 'python3',
  // windows: [
  //   {
  //     label: 'main',
  //     fullscreen: false,
  //     alwaysOnTop: false,
  //     //displayId: '69733248', //manually specify
  //     file: 'app/local/index.html',
  //   },
  // ],
};
