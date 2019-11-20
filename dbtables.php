<?php
		header("Access-Control-Allow-Origin: *");
		header("Expires: 0");
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
		header("Cache-Control: no-store, no-cache, must-revalidate");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");
		header("Content-Type: application/json; charset=UTF-8");
		
		$servername = "localhost";
		$username = "root";
		$password = "password";
		$dbname = "restaurantmgmt";
		
		// Create connection
		$conn = new mysqli($servername, $username, $password, $dbname);
		// Check connection
		if ($conn->connect_error) {
			die("Connection failed: " . $conn->connect_error);
		}
		
		$sql = "SELECT * FROM tables";
		$res = $conn->query($sql);
		$result = array();
		
		while( $row = $res->fetch_assoc() )
			array_push($result, array('ID' => $row["table_id"],
									  'Table' => $row["table_num"],
									  'Type' => $row["table_type"],
									  'Location' => $row["table_loc"],
									  'Seats' => $row["table_seats"],
									  'Available' => $row["table_avail"]));
		
		$conn->close();
		echo json_encode($result, JSON_NUMERIC_CHECK);
		 
?>