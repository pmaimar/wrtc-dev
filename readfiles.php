<?php
function listar_archivos($carpeta){
    if(is_dir($carpeta)){
        if($dir = opendir($carpeta)){
            while(($archivo = readdir($dir)) !== false){
                if($archivo != '.' && $archivo != '..' && $archivo != '.htaccess'){
                	echo '<p>Emitido: '.date("F d Y H:i:s.",filemtime("./uploads/".$archivo)).'</p>';
                    echo '<video src="/'.$carpeta.'/'.$archivo.'" controls>'.$archivo.'</video>';
                }
            }
            closedir($dir);
        }
    }
}
 
echo listar_archivos('./uploads');
?>