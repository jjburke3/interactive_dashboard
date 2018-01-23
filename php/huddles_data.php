<?php
// florida sql credentials
$servername = "";
$username = "";
$password = "";
$dbname = "";

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
// simple select from florida database
$sql = "
SELECT 'Florida' as STATE, a.* FROM jburke.HUDDLE_WEBPAGE".($_GET['table']==0?"":"_OLD")." a
where DATA_DATE = '".$_GET['date']."'
order by PAGE_TYPE, PAGE_ORDER asc
";
// run mysql query
$result = mysqli_query($conn,$sql);
// create array to put data into
$data = array();


// for each row of data, put into array
for ($x = 0; $x < mysqli_num_rows($result); $x++) {
	$data[] = mysqli_fetch_assoc($result);
}

// close mysql connection
mysqli_close($conn);
// texas sql credentials
$myServer = "";
$myUser = "";
$myPass = "";
$myDB = "";


//create an instance of the  ADO connection object
$conn = new COM ("ADODB.Connection")
  or die("Cannot start ADO");

//define connection string, specify database driver
$connStr = "PROVIDER=SQLOLEDB;SERVER=".$myServer.";UID=".$myUser.";PWD=".$myPass.";DATABASE=".$myDB; 
  $conn->open($connStr); //Open the connection to the database

//declare the SQL statement that will query the database
$query = "SELECT 'Texas' as STATE, a.* FROM Periscope_Data.dbo.HUDDLE_WEBPAGE".($_GET['table']==0?"":"_OLD")." a
where DATA_DATE = '".$_GET['date']."'
order by PAGE_TYPE, PAGE_ORDER asc";

//execute the SQL statement and return records
$rs = $conn->execute($query);
// get number of columns in sql result
$num_columns = $rs->Fields->Count();

// loop through each column
for ($i=0; $i < $num_columns; $i++) {
    $arrColumns[] = $rs->Fields($i);
	$newArr[] = $rs->Fields($i)->name;
}

while (!$rs->EOF)  //carry on looping through while there are records
{
	$arrRow = array();
	for($i=0; $i < $num_columns; $i++) {
		$arrRow[$newArr[$i]] = (string)$arrColumns[$i]->value;
	}
	$data[] = $arrRow;
    $rs->MoveNext(); //move on to the next record
}



//close the connection and recordset objects freeing up resources 
$rs->Close();
$conn->Close();

$rs = null;
$conn = null;
	
// output both florida and texas results as one json string
echo json_encode($data);
?>