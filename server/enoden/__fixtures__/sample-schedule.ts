// Real (trimmed) data captured manually from loo-ool.com's schedule script during
// implementation. Used by safe-array-parser.test.ts and position-calculator.test.ts.

export const SAMPLE_SCHEDULE_SCRIPT = `
TLD=new Array(
[310,329,2,"$10",0,1,1,"","1","",8,310,6,315,6,324,1,"+329",1]
,[1417,1437,1,"$11",0,1,1,"","6","",8,1417,1,1422,1,1432,6,"+1437",6]
,[315,364,2,"$200",0,1,1,"","1","",12,315,15,320,15,342,6,350,6,359,1,"+364",1]
);
STP=new Array(0,1,10,19,29,41,50,59,71,85,103,115,125,134,139,151);
STN=new Array('','藤沢','石上','柳小路','鵠沼','湘南海岸公園','江ノ島','腰越','鎌倉高校前','七里ヶ浜','稲村ヶ崎','極楽寺','長谷','由比ヶ浜','和田塚','鎌倉');
TYP=new Array('','#2c8311','white','');
DTX=new Array('下り','上り');
`;

/** Each entry should fail to parse rather than execute anything. */
export const MALICIOUS_SCHEDULE_SCRIPTS = [
  // arbitrary function call inside an array literal
  `TLD=new Array([1,2,alert(1)]);STP=new Array(1);STN=new Array('a');DTX=new Array('a');`,
  // attempted require() to read filesystem
  `TLD=new Array([1]);STP=new Array(1);STN=new Array('a', require('fs').readFileSync('/etc/passwd'));DTX=new Array('a');`,
  // bare arithmetic expression instead of a literal
  `TLD=new Array([1,2,3+4]);STP=new Array(1);STN=new Array('a');DTX=new Array('a');`,
  // template literal / identifier reference
  `TLD=new Array([1,2,\`\${window.location}\`]);STP=new Array(1);STN=new Array('a');DTX=new Array('a');`,
];
