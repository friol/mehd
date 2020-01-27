/* main.js */

var glbEditor;
var lastCalledTime;
var fps;
var glbCounter=0;
var glbFrameCapturer;

function drawPhun()
{
    glbEditor.draw();
    glbEditor.update();

    if(!lastCalledTime) 
    {
        lastCalledTime = performance.now();
        fps = 0;
    }
    else
    {
        var delta = (performance.now() - lastCalledTime)/1000;
        lastCalledTime = performance.now();
        fps = 1/delta;
        var nFps=parseFloat(fps);
        glbCounter++;

        if (glbCounter==60)
        {
            document.getElementById("fpsspan").innerHTML=" - going at "+nFps.toFixed(2).toString()+" fps";
            glbCounter=0;
        }
    }

    if (glbFrameCapturer.started)
    {
        var cvs=document.getElementById("maincanvas");
        glbFrameCapturer.capturer.capture(cvs);
    }

    window.requestAnimationFrame(drawPhun);
}

window.onload=function()
{
    var mehdVersion="0.10";
    document.title="mehd v"+mehdVersion+" - fantasy editor";
    document.getElementById("versionSpan").innerHTML="mehd v"+mehdVersion;

    glbFrameCapturer=new frameExporter("maincanvas");
    glbEditor=new editor("maincanvas",mehdVersion,glbFrameCapturer);

    drawPhun();
}
