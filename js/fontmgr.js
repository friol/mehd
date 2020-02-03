/* font manager */

class fontmgr
{
    constructor(cnvsid,colorPal)
    {
        this.cnvsid=cnvsid;
        const canvas=document.getElementById(this.cnvsid);
        this.context = canvas.getContext('2d');

        this.multiplier=4;
        this.fontwidth=5*this.multiplier;
        this.fontheight=7*this.multiplier;
        this.lettersShiftX=2*this.multiplier;

        this.numLettersX=18;
        this.numLettersY=6;

        this.fgcolor=colorPal[0];
        this.bgcolor=colorPal[1];
        this.selcolor=colorPal[2];

        //

        this.fontCanvasArray=[];
        this.initFontCanvasArray(this.fgcolor,0);

        for (var i=0;i<colorPal.length-3;i++)
        {
            this.initFontCanvasArray(colorPal[i+3],i+1);
        }
        
        this.reverseCanvasArray=[];
        this.initReverseCanvasArray();
    }

    colToRGB(strcol)
    {
        strcol=strcol.replace("#","");
        var r=parseInt(strcol.substring(0,2),16);
        var g=parseInt(strcol.substring(2,4),16);
        var b=parseInt(strcol.substring(4,6),16);
        return [r,g,b];
    }

    initFontCanvasArray(fgcol,chsid)
    {
        var newCharset=new Array();
        this.fontCanvasArray.push(newCharset);

        var img=document.getElementById("fontImage");

        for (var l=0;l<this.numLettersX*this.numLettersY;l++)
        {
            var cvs = document.createElement('canvas');
            cvs.width = this.fontwidth+this.multiplier; 
            cvs.height = this.fontheight+this.multiplier;
            var ctx = cvs.getContext("2d");
    
            var realPosx=l%this.numLettersX;
            var realPosy=Math.floor(l/this.numLettersX);

            ctx.drawImage(img,realPosx*this.fontwidth+(this.lettersShiftX*realPosx),realPosy*this.fontheight,
                            this.fontwidth,this.fontheight,
                            0,0,
                            this.fontwidth,this.fontheight);

            var idt = ctx.getImageData(0,0,cvs.width,cvs.height);
            var data = idt.data;

            for (var p=0;p<data.length;p+=4)
            {
                var a=data[p+3];
                if ((data[p+0]==24)&&(data[p+1]==49)&&(data[p+2]==37))
                {
                    data[p+0]=this.colToRGB(fgcol)[0];
                    data[p+1]=this.colToRGB(fgcol)[1];
                    data[p+2]=this.colToRGB(fgcol)[2];
                }
            }

            ctx.putImageData(idt,0,0);
            this.fontCanvasArray[chsid].push(cvs);
        }
    }

    initReverseCanvasArray()
    {
        this.reverseCanvasArray=[];
        var img=document.getElementById("fontImage");

        for (var l=0;l<this.numLettersX*this.numLettersY;l++)
        {
            var realPosx=l%this.numLettersX;
            var realPosy=Math.floor(l/this.numLettersX);

            var cvs = document.createElement('canvas');
            cvs.width = this.fontwidth+this.multiplier; 
            cvs.height = this.fontheight+this.multiplier;
            var ctx = cvs.getContext("2d");

            var idt1 = ctx.getImageData(0,0,cvs.width,cvs.height);
            var data1 = idt1.data;

            for (var p=0;p<data1.length;p+=4)
            {
                data1[p+0]=0; data1[p+1]=0; data1[p+2]=0; data1[p+3]=0;
            }
            ctx.putImageData(idt1,0,0);

            ctx.drawImage(img,realPosx*this.fontwidth+(this.lettersShiftX*realPosx),realPosy*this.fontheight,
                            this.fontwidth,this.fontheight,
                            0,0,
                            this.fontwidth,this.fontheight);
            var idt = ctx.getImageData(0,0,cvs.width,cvs.height);
            var data = idt.data;

            for (var p=0;p<data.length;p+=4)
            {
                var r=data[p+0];
                var g=data[p+1];
                var b=data[p+2];
                var a=data[p+3];

                if (a==0)
                {
                    data[p+0]=this.colToRGB(this.fgcolor)[0]; data[p+1]=this.colToRGB(this.fgcolor)[1]; data[p+2]=this.colToRGB(this.fgcolor)[2]; data[p+3]=255;
                }
                else
                {
                    data[p+0]=this.colToRGB(this.bgcolor)[0]; data[p+1]=this.colToRGB(this.bgcolor)[1]; data[p+2]=this.colToRGB(this.bgcolor)[2]; data[p+3]=255;
                }
            }

            ctx.putImageData(idt,0,0);
            this.reverseCanvasArray.push(cvs);
        }
    }

    setColors(colorPal)
    {
        this.fgcolor=colorPal[0];
        this.bgcolor=colorPal[1];
        this.selcolor=colorPal[2];        
    }

    getCharCoord(x,y)
    {
        var charx=Math.floor(x/(this.fontwidth+this.multiplier));
        var chary=Math.floor(y/(this.fontheight+1));
        return [charx,chary];        
    }

    drawSelectionQuad(x,y)
    {
        const canvas=document.getElementById(this.cnvsid);
        const context = canvas.getContext('2d');

        var origPx=x;
        var origPy=y;

        x*=this.fontwidth;
        y*=this.fontheight;

        // x letter spacing
        x+=(this.lettersShiftX/2)*origPx;

        // inner margin
        x+=1;

        // line spacing
        y+=origPy;

        context.fillStyle=this.selcolor;
        context.fillRect(x,y,this.fontwidth+this.multiplier,this.fontheight+1);
    }

    drawCursor(cx,cy,ctick,csteps,inverted)
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

        this.drawChar(cx,cy,String.fromCharCode(127),alpha,inverted,0);
    }

    drawChar(px,py,ch,chalpha,chreverse,charColorNum)
    {
        //const canvas=document.getElementById(this.cnvsid);
        //const context = canvas.getContext('2d');

        var origPx=px;
        var origPy=py;

        px*=this.fontwidth;
        py*=this.fontheight;

        // x letter spacing
        px+=(this.lettersShiftX/2)*origPx;

        // inner margin
        px+=1;
        py+=1;

        // line spacing
        py+=origPy;

        var charShift=32;
        var charIndex=ch.charCodeAt(0)-charShift;

        var realPosx=charIndex%this.numLettersX;
        var realPosy=Math.floor(charIndex/this.numLettersX);

        if ((realPosx<0)||(realPosx>=this.numLettersX)||(realPosy<0)||(realPosy>=this.numLettersY))
        {
            return;
        }

        var img=document.getElementById("fontImage");

        if (!chreverse)
        {
            this.context.globalAlpha = chalpha;
            var cvs=this.fontCanvasArray[charColorNum][charIndex];
            this.context.drawImage(cvs,px,py);            
            this.context.globalAlpha = 1;
        }
        else
        {
            var cvs=this.reverseCanvasArray[charIndex];
            this.context.drawImage(cvs,px,py);
        }
    }
}
