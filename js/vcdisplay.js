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

        this.previousLineX=0;
        this.previousLineY=0;

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

    circfill(arglist)
    {
        var cx,cy,radius,palcol;

        cx=arglist[0][1];
        cy=arglist[1][1];

        if (arglist.length>2) radius=arglist[2][1];
        else radius=4;

        if (arglist.length>3) palcol=arglist[3][1];
        else palcol=this.pencolor;

        this.srcContext.beginPath();
        this.srcContext.arc(cx, cy, radius, 0, 2 * Math.PI, false);
        this.srcContext.fillStyle = 'green';
        this.srcContext.fill();
        this.srcContext.lineWidth = 5;
        this.srcContext.strokeStyle = '#003300';
        this.srcContext.stroke();        
    }

    line(arglist)
    {
        var x0,y0,x1,y1,palcol;

        var palcol=this.pencolor;
        if (arglist.length==3) palcol=arglist[2][1];
        if (arglist.length==5) palcol=arglist[4][1];

        if (arglist.length==2)
        {
            x0=this.previousLineX;
            y0=this.previousLineY;
            x1=arglist[0][1];
            y1=arglist[1][1];
        }
        else if ((arglist.length==4)||(arglist.length==5))
        {
            x0=arglist[0][1];
            y0=arglist[1][1];
            x1=arglist[2][1];
            y1=arglist[3][1];
        }

        this.srcContext.strokeStyle=this.palette[palcol];
        this.srcContext.beginPath();
        this.srcContext.moveTo(x0,y0);
        this.srcContext.lineTo(x1,y1);
        this.srcContext.stroke();

        this.previousLineX=x1;
        this.previousLineY=y1;
    }

    setPenColor(palcol)
    {
        this.pencolor=palcol;
    }

    rectfill(x0,y0,x1,y1,palcol)
    {
        if (palcol==-1) palcol=this.pencolor;
        this.srcContext.fillStyle=this.palette[palcol];
        this.srcContext.fillRect(x0,y0,x1-x0,y1-y0);
    }

    pset(x,y,palcol)
    {
        if (palcol==-1) palcol=this.pencolor;
        this.srcContext.fillStyle=this.palette[palcol];
        this.srcContext.fillRect(x,y,1,1);
    }

    cls(palcol)
    {
        if (palcol==-1) palcol=this.pencolor;
        this.srcContext.fillStyle=this.palette[palcol];
        this.srcContext.fillRect(0,0,this.dimx,this.dimy);
    }

    draw()
    {
        this.context.drawImage(this.srcCanvas,this.px,this.py);
    }
} 
