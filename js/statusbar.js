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
        this.mode=0; // 0 - statusbar, 1 - command bar, 2 - command result mode
        this.videocolumns=totcols;

        this.currentCommand="";
        this.cursorPosx=1;

        this.outputMsg="";
        this.mode2tick=0;
        this.mode2numTicks=60*2;
    }

    setMode(m)
    {
        this.mode=m;
    }

    setOutputMessage(m)
    {
        this.outputMsg=m;
        this.mode2tick=0;
    }

    setStatus(msg)
    {
        this.mode=2;
        this.outputMsg=msg;
        this.mode2tick=0;
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

    update()
    {
        if (this.mode==2)
        {
            this.mode2tick++;
            if (this.mode2tick>=this.mode2numTicks)
            {
                this.mode2tick=0;
                this.mode=0;
            }
        }
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
        else if (this.mode==1)
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
        else
        {
            // output mode
            var str=this.outputMsg;
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
    }
}
