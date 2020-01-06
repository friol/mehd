/* scrollbar */

class scrollbar
{
    constructor(cnvsid,arrowUpId,arrowDownId,multiplier,fontheight)
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
    }

    draw()
    {
        var imgup=document.getElementById(this.sbupId);
        var imgdn=document.getElementById(this.sbdnId);

        // uparrow 
        this.context.drawImage(imgup,this.px-(this.multiplier)-2,this.multiplier);

        this.context.beginPath();
        this.context.strokeStyle = "#83FFC7";
        this.context.lineWidth = this.multiplier;
        this.context.rect(this.px-(this.multiplier*2)-2-1,3,this.arrowwidth+(this.multiplier*2),this.arrowwidth);
        this.context.stroke();

        // dwnarrow
        var ypos=this.canvas.height-this.fontheight-(this.multiplier*2)-imgdn.height;
        this.context.drawImage(imgdn,this.px-(this.multiplier)-2,ypos-this.multiplier);

        this.context.beginPath();
        this.context.strokeStyle = "#83FFC7";
        this.context.lineWidth = this.multiplier;
        this.context.rect(this.px-(this.multiplier*2)-2-1,
                ypos-this.multiplier*3,
                this.arrowwidth+(this.multiplier*2),
                this.arrowwidth);
        this.context.stroke();

        // big rectangle
        
        this.context.beginPath();
        this.context.strokeStyle = "#83FFC7";
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
            this.context.fillStyle = "#83FFC7";
            this.context.fillRect(this.px-(this.multiplier)-1,this.arrowheight+this.multiplier*6+c,this.arrowwidth-(this.multiplier),this.fontheight);
        }
    }

}
