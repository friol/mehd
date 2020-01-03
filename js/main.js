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
    var mehdVersion="0.5";
    document.title="mehd v"+mehdVersion+" - the text editor of the next decade";
    document.getElementById("versionSpan").innerHTML="mehd v"+mehdVersion;
    
    glbEditor=new editor("maincanvas",mehdVersion);
    drawPhun();
}
