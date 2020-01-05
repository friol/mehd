/* no comments world - selection.js */

class selection
{
    constructor(cnvsid,linelen,fontmgr,linearr)
    {
        this.canvas=document.getElementById(cnvsid);
        this.context = this.canvas.getContext('2d');

        this.active=false;
        this.origx=0;
        this.origline=0;
        this.endx=0;
        this.endline=0;

        this.lineChars=linelen;

        this.fontManager=fontmgr;
        this.lineArray=linearr;
    }

    set(ox,ol,ex,el)
    {
        this.active=true;
        this.origx=ox;
        this.origline=ol;
        this.endx=ex;
        this.endline=el;
    }

    update(linearr)
    {
        this.lineArray=linearr;
    }

    draw()
    {
        if (this.active)
        {
            var px=this.origx;
            var py=this.origline;
            var done=false;

            while (!done)
            {
                this.fontManager.drawSelectionQuad(px,py);

                px++;
                if (px>=this.lineArray[py].length)
                {
                    px=0;
                    py+=1;
                }

                if ((px==this.endx)&&(py==this.endline))
                {
                    this.fontManager.drawSelectionQuad(px,py);
                    done=true;
                }

                if (py>=this.lineArray.length)
                {
                    done=true;
                }
            }

        }
    }
}
