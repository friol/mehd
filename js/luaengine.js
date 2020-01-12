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
            var program="";

            for (var i=0;i<txtarr.length;i++)
            {
                if (txtarr[i].length>0)
                {
                    program+=txtarr[i]+"\n";
                }
            }

            var res=this.parser.parse(program);
            this.execute(res);
            return res;
        }
        catch(e)
        {
            alert("Error parsing code: ["+e.toString()+"]");
            return 0;
        }
    }

    execute(parseTree)
    {
        parseTree.forEach(element => 
        {
            var eltype=element[0];
            
            if (eltype=="COMMENT")
            {
                // pass
            }
            else if (eltype=="ASSIGNMENT")
            {
                
            }
        }
        );
    }
}
