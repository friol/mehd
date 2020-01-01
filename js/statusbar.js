/* status bar */

class statusbar
{
    constructor(row,col,cnvsid,statusLine,fontmgr)
    {
        this.cnvsid=cnvsid;
        this.cursorRow=row;
        this.cursorCol=col;
        this.statusLine=statusLine;
        this.fontManager=fontmgr;
        this.mode=0; // 0 - statusbar, 1 - saving bar
    }

    updateCursorPos(row,col)
    {
        this.cursorRow=row;
        this.cursorCol=col;
    }

    draw()
    {
        var str="row: "+this.cursorRow+" col: "+this.cursorCol;
        for (var c=0;c<str.length;c++)
        {
            this.fontManager.drawChar(c,this.statusLine,str.charAt(c),1,true);
        }
    }
}
