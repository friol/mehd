/* font manager */

class fontmgr
{
    constructor(cnvsid)
    {
        this.cnvsid=cnvsid;

        this.multiplier=4;
        this.fontwidth=5*this.multiplier;
        this.fontheight=7*this.multiplier;
        this.lettersShiftX=2*this.multiplier;

        this.numLettersX=18;
        this.numLettersY=6;
    }

    drawCursor(cx,cy,ctick,csteps)
    {
        var alpha;
        if (ctick<(csteps/2))
        {
            alpha=ctick/(csteps/2);
        }
        else
        {
            alpha=1-((ctick-(csteps/2))/(csteps/2));
        }
        
        this.drawChar(cx,cy,String.fromCharCode(127),alpha,false);
    }

    drawChar(px,py,ch,chalpha,chreverse)
    {
        const canvas=document.getElementById(this.cnvsid);
        const context = canvas.getContext('2d');

        var origPx=px;

        px*=this.fontwidth;
        py*=this.fontheight;

        // x letter spacing
        px+=(this.lettersShiftX/2)*origPx;

        // inner margin
        px+=1;
        py+=1;

        var charShift=32;
        var charIndex=ch.charCodeAt(0)-charShift;

        var realPosx=charIndex%this.numLettersX;
        var realPosy=Math.floor(charIndex/this.numLettersX);

        var img=document.getElementById("fontImage");

        if (!chreverse)
        {
            context.globalAlpha = chalpha;
            context.drawImage(img,realPosx*this.fontwidth+(this.lettersShiftX*realPosx),realPosy*this.fontheight,this.fontwidth,this.fontheight,px,py,this.fontwidth,this.fontheight);
            context.globalAlpha = 1;
        }
        else
        {
            var cvs = document.createElement('canvas');
            cvs.width = this.fontwidth+this.multiplier; 
            cvs.height = this.fontheight+this.multiplier;
            var ctx = cvs.getContext("2d");

            var idt1 = ctx.getImageData(0,0,cvs.width,cvs.height);
            var data1 = idt1.data;

            for (var p=0;p<data1.length;p+=4)
            {
                data1[p+0]=131; data1[p+1]=255; data1[p+2]=199; data1[p+3]=255;
            }
            ctx.putImageData(idt1,0,0);

            ctx.drawImage(img,realPosx*this.fontwidth+(this.lettersShiftX*realPosx),realPosy*this.fontheight,
                            this.fontwidth,this.fontheight,
                            0,0,
                            this.fontwidth,this.fontheight);
            var idt = ctx.getImageData(0,0,cvs.width-this.multiplier,cvs.height-this.multiplier);
            var data = idt.data;

            for (var p=0;p<data.length;p+=4)
            {
                var r=data[p+0];
                var g=data[p+1];
                var b=data[p+2];

                if ((r==25)&&(g==67)&&(b==43))
                {
                    data[p+0]=131; data[p+1]=255; data[p+2]=199; data[p+3]=255;
                }
                else
                {
                    data[p+0]=25; data[p+1]=67; data[p+2]=43; data[p+3]=255;
                }
            }

            ctx.putImageData(idt,0,0);
            context.drawImage(cvs,px,py);
        }
    }
}
