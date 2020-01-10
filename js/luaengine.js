/* lua engine - parser and execution engine */

class luaengine
{
    constructor()
    {
        var tempGrammar=document.getElementById("luaGrammar").innerText;

        try
        {
            this.parser=peg.generate(tempGrammar);
        }
        catch(e)
        {
            alert("Exception parsing internal LUA grammar ["+e.toString()+"]");
        }
    }

    parseAndRun(txtarr)
    {
        try
        {
            var res=this.parser.parse(txtarr[0]);
            return res;
        }
        catch(e)
        {
            alert("Error parsing code: ["+e.toString()+"]");
            return 0;
        }
    }
}
