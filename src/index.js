import _ from 'lodash';

function component() {
    const element = document.createElement('div');
    const btn = document.createElement('button');

    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');
    btn.innerHTML = 'Click me and check the console!';
    btn.onclick = () => console.log("Fuck this shit");

    element.append(btn);

    return element;
}

document.body.appendChild(component());