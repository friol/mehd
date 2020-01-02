/* status bar */

class statusbar
{
    constructor(row,col,cnvsid,statusLine,fontmgr,totcols)
    {
        this.cnvsid=cnvsid;
        this.cursorRow=row;
        this.cursorCol=col;
        this.statusLine=statusLine;
        this.fontManager=fontmgr;
        this.mode=0; // 0 - statusbar, 1 - command bar
        this.videocolumns=totcols;

        this.currentCommand="";
        this.cursorPosx=1;
    }

    setMode(m)
    {
        this.mode=m;
    }

    backSpace()
    {
        if (this.currentCommand.length>0)
        {
            this.currentCommand=this.currentCommand.substring(0,this.currentCommand.length-1);
            this.cursorPosx--;
        }
    }

    resetCommand()
    {
        this.currentCommand="";
        this.cursorPosx=1;
    }

    addChar(c)
    {
        this.currentCommand+=c;        
        this.cursorPosx++;
    }

    updateCursor(row,col,tick,steps)
    {
        this.cursorRow=row;
        this.cursorCol=col;
        this.cursorTick=tick;
        this.cursorSteps=steps;
    }

    draw()
    {
        if (this.mode==0)
        {
            var str="row: "+this.cursorRow+" col: "+this.cursorCol;
            var ln=str.length;

            var paddingLen=this.videocolumns-ln;
            for (var s=0;s<paddingLen;s++)
            {
                str+=" ";
            }

            for (var c=0;c<str.length;c++)
            {
                this.fontManager.drawChar(c,this.statusLine,str.charAt(c),1,true);
            }
        }
        else
        {
            var str=":"+this.currentCommand;

            var ln=str.length;

            var paddingLen=this.videocolumns-ln;
            for (var s=0;s<paddingLen;s++)
            {
                str+=" ";
            }

            for (var c=0;c<str.length;c++)
            {
                this.fontManager.drawChar(c,this.statusLine,str.charAt(c),1,true);
            }

            this.fontManager.drawCursor(this.cursorPosx,this.statusLine,this.cursorTick,this.cursorSteps,true);
        }
    }
}
