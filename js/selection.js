/* no comments world - selection.js */

class selection
{
    constructor(cnvsid,linelen,fontmgr)
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
    }

    set(ox,ol,ex,el)
    {
        this.active=true;
        this.origx=ox;
        this.origline=ol;
        this.endx=ex;
        this.endline=el;

    }

    draw()
    {
        if (this.active)
        {
            var pos=0;
            var cntr=this.origx+(this.origline*this.lineChars);
            while (cntr<=(this.endx+(this.endline*this.lineChars)))
            {
                var px=cntr%this.lineChars;
                var py=this.origline+Math.floor(pos/this.lineChars);
                this.fontManager.drawSelectionQuad(px,py);
                cntr+=1;
                pos++;
            }
        }
    }
}
