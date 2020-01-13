/* lua engine - parser and execution engine */

class luaengine
{
    constructor()
    {
        var tempGrammar=document.getElementById("luaGrammar").innerText;
        this.parsetree=null;

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

            this.parsetree=this.parser.parse(program);
            this.execute();
            return this.parsetree;
        }
        catch(e)
        {
            alert("Error parsing code: ["+e.toString()+"]");
            return 0;
        }
    }

    evaluateExpression(e)
    {
        if (typeof e == 'number')
        {
            // expression is an immediate number
            return ['NUMBER',e];
        }
        else if (typeof e == 'string')
        {
            // expression is a string
            return ['STRING',e];
        }
    }

    execute()
    {
        this.parsetree.forEach(element => 
        {
            var eltype=element[0][0];
            
            if (eltype=="COMMENT")
            {
                // pass
            }
            else if (eltype=="ASSIGNMENT")
            {
                var varName=element[0][1];
                var varValue=this.evaluateExpression(element[0][2]);

            }
            else if (eltype=="FUNCTIONCALL")
            {
                var funName=element[0][1];
                
            }
        }
        );
    }
}
