/* undo manager */

class undomgr
{
    constructor()
    {
        this.listOfUndoActions=[];

    }

    addChar(px,py)
    {
        this.listOfUndoActions.push(["addChar",px,py]);
    }

    backspace(ch,theEditor)
    {
        this.listOfUndoActions.push(["backspace",ch,theEditor.cursorx,theEditor.cursory]);
    }

    carriageReturn(theEditor)
    {
        this.listOfUndoActions.push(["cr",theEditor.cursory]);
    }

    undoLastAction(theEditor)
    {
        if (this.listOfUndoActions.length==0)
        {
            return;
        }

        var action=this.listOfUndoActions[this.listOfUndoActions.length-1];

        if (action[0]=="addChar")
        {
            var px=action[1];
            var py=action[2];
            theEditor.lineArray[py]=theEditor.lineArray[py].substring(0,px);
            theEditor.cursorx--;
        }
        else if (action[0]=="cr")
        {
            var line=action[1];
            theEditor.cursory=line-1;
            theEditor.cursorx=theEditor.lineArray[line-1].length;
        }
        else if (action[0]=="backspace")
        {
            var ch=action[1];
            var px=action[2];
            var py=action[3];

            if (ch=="\n")
            {
                theEditor.cursorx=0;
                theEditor.cursory++;
            }
            else
            {
                theEditor.lineArray[py]+=ch;
                theEditor.cursorx++;
            }
        }

        this.listOfUndoActions.pop();
    }
}
