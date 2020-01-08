/* scrollbar */

class scrollbar
{
    constructor(cnvsid,arrowUpId,arrowDownId,multiplier,fontheight,colpal)
    {
        this.canvas=document.getElementById(cnvsid);
        this.context = this.canvas.getContext('2d');

        this.sbupId=arrowUpId;
        this.sbdnId=arrowDownId;

        // calc positions of arrows and other elements
        var cnvswidth=this.canvas.width;
        this.arrowwidth=document.getElementById(this.sbupId).width;
        this.arrowheight=document.getElementById(this.sbupId).height;

        this.px=cnvswidth-this.arrowwidth;

        this.multiplier=multiplier;
        this.fontheight=fontheight;

        this.fgcolor=colpal[0];

        // todo: convert arrow images to fgcolor
        this.arrowArray=[];
        this.initArrowArray();
    }

    setColors(colpal)
    {
        this.fgcolor=colpal[0];
    }

    colToRGB(strcol)
    {
        strcol=strcol.replace("#","");
        var r=parseInt(strcol.substring(0,2),16);
        var g=parseInt(strcol.substring(2,4),16);
        var b=parseInt(strcol.substring(4,6),16);
        return [r,g,b];
    }

    initArrowArray()
    {
        this.arrowArray=[];
        var imgup=document.getElementById(this.sbupId);
        var imgdn=document.getElementById(this.sbdnId);

        for (var i=0;i<2;i++)
        {
            var cvs = document.createElement('canvas');
            cvs.width = imgup.width; 
            cvs.height = imgup.height;
            var ctx = cvs.getContext("2d");

            if (i==0) ctx.drawImage(imgup,0,0);
            else ctx.drawImage(imgdn,0,0);

            var idt1 = ctx.getImageData(0,0,cvs.width,cvs.height);
            var data1 = idt1.data;

            for (var p=0;p<data1.length;p+=4)
            {
                if ((data1[p+0]==0)&&(data1[p+1]==0)&&(data1[p+2]==0)&&(data1[p+3]==255))
                {
                    data1[p+0]=this.colToRGB(this.fgcolor)[0]; data1[p+1]=this.colToRGB(this.fgcolor)[1]; data1[p+2]=this.colToRGB(this.fgcolor)[2]; data1[p+3]=255;
                }
            }        

            ctx.putImageData(idt1,0,0);
            this.arrowArray.push(cvs);
        }
    }

    draw()
    {
        var imgup=document.getElementById(this.sbupId);
        var imgdn=document.getElementById(this.sbdnId);

        // uparrow 
        this.context.drawImage(this.arrowArray[0],this.px-(this.multiplier)-2,this.multiplier);

        this.context.beginPath();
        this.context.strokeStyle = this.fgcolor;
        this.context.lineWidth = this.multiplier;
        this.context.rect(this.px-(this.multiplier*2)-2-1,3,this.arrowwidth+(this.multiplier*2),this.arrowwidth);
        this.context.stroke();

        // dwnarrow
        var ypos=this.canvas.height-this.fontheight-(this.multiplier*2)-imgdn.height;
        this.context.drawImage(this.arrowArray[1],this.px-(this.multiplier)-2,ypos-this.multiplier);

        this.context.beginPath();
        this.context.strokeStyle = this.fgcolor;
        this.context.lineWidth = this.multiplier;
        this.context.rect(this.px-(this.multiplier*2)-2-1,
                ypos-this.multiplier*3,
                this.arrowwidth+(this.multiplier*2),
                this.arrowwidth);
        this.context.stroke();

        // big rectangle
        
        this.context.beginPath();
        this.context.strokeStyle = this.fgcolor;
        this.context.lineWidth = this.multiplier;
        this.context.rect(this.px-(this.multiplier*2)-2-1,
                1+this.arrowheight+this.multiplier*5,
                this.arrowwidth+(this.multiplier*2),
                ypos-this.arrowwidth-this.multiplier*7);
        this.context.stroke();

        // scroller
        var totalLen=ypos-this.arrowwidth-this.multiplier*7-this.arrowheight-this.multiplier*5;
        var step=this.fontheight;

        for (var c=1;c<totalLen;c+=step)
        {
            this.context.fillStyle = this.fgcolor;
            this.context.fillRect(this.px-(this.multiplier)-1,this.arrowheight+this.multiplier*6+c,this.arrowwidth-(this.multiplier),this.fontheight);
        }
    }

}
