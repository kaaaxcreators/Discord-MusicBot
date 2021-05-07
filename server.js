const express = require('express');
const server = express();
server.all('/', (req, res) => {
  res.send(
    '<iframe src="https://discord.com/widget?id=739612214201286758&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>'
  );
});
function keepAlive() {
  server.listen(8080, () => {
    console.log('Server is Ready!');
  });
}
module.exports = keepAlive;
