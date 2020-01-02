/* main.js */

var glbEditor;

function drawPhun()
{
    glbEditor.draw();
    glbEditor.update();
    window.requestAnimationFrame(drawPhun);
}

window.onload=function()
{
    glbEditor=new editor("maincanvas");
    drawPhun();
}
