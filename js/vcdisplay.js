/* vc display */

class vcdisplay
{
    constructor(cvsid)
    {
        this.canvas=document.getElementById(cvsid);
        this.context = this.canvas.getContext('2d');

        this.dimx=128;
        this.dimy=128;

        this.pencolor=0;

        this.palette=["#000000","#1D2B53","#7E2553",
            "#008751","#AB5236","#5F574F","#C2C3C7",
            "#FFF1E8","#FF004D","#FFA300","#FFEC27",
            "#00E436","#29ADFF","#83769C","#FF77A8","#FFCCAA"];

        this.px=this.canvas.width-this.dimx-50;
        this.py=0;

        this.srcCanvas=document.createElement("canvas");
        this.srcCanvas.width=this.dimx;
        this.srcCanvas.height=this.dimy;
        this.srcContext = this.srcCanvas.getContext('2d');
        this.srcContext.fillStyle=this.palette[0];
        this.srcContext.fillRect(0, 0, this.srcCanvas.width, this.srcCanvas.height);
    }

    draw()
    {
        this.context.drawImage(this.srcCanvas,this.px,this.py);
    }
} 
