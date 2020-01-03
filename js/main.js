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
    var mehdVersion="0.4";
    glbEditor=new editor("maincanvas",mehdVersion);
    drawPhun();
}
