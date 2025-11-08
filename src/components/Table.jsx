export default function Table({ cols = [], rows = [] }) {
  return (
    <div style={{overflow:'auto', border:'1px solid #eee', borderRadius:6}}>
      <table style={{minWidth:600, fontSize:14, width:'100%', borderCollapse:'collapse'}}>
        <thead style={{background:'#f8fafc'}}>
          <tr>
            {cols.map(c => <th key={c} style={{textAlign:'left', padding:8, borderBottom:'1px solid #eee'}}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              {Object.values(r).map((v,j)=>(
                <td key={j} style={{padding:8, borderTop:'1px solid #f1f5f9'}}>{String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
