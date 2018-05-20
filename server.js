var  express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('node_modules'));

//PORT
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Listening on port ${port}...`));