import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
//firebase
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
//browser-image-resizer
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';

//uuid
import {v4 as uuidv4} from 'uuid';


@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.css']
})
export class AddPostComponent implements OnInit {

  locationName:string;
  description:string;
  picture:string=null;
  user=null;
  uploadPercent:Number=null;

  constructor(
    private auth:AuthService,
    private router:Router,
    private toastr:ToastrService,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
  ) { 
    this.auth.getUser().subscribe((user)=>{
        this.db.object(`/users/${user.uid}`)
        .valueChanges()
        .subscribe((user)=>{
          this.user=user
        })
    })
  }

  ngOnInit(): void {
  }

  onSubmit(){
    const uuid= uuidv4();

    
    this.db.object(`/posts/${uuid}`)
    .set({
      id: uuid,
      locationName:this.locationName,
      description:this.description,
      picture: this.picture,
      by:this.user.name,
      instaId:this.user.instaUserName,
      date:Date.now()
       })
       .then(()=>{
        this.toastr.success("Post added successfully");
        this.router.navigateByUrl("/");
       })
       .catch((err)=>{
         this.toastr.error("Some err")
       })

  }

async uploadFile(event){

  const file=event.target.files[0];

  let resizedImage=await readAndCompressImage(file,imageConfig);

  let filePath=file.name;

  let fileRef=this.storage.ref(filePath);

  let task=this.storage.upload(filePath,resizedImage);

  task.percentageChanges().subscribe((percentage)=>{
    this.uploadPercent=percentage;
  })

  task.snapshotChanges().pipe(
    finalize(()=>{
        fileRef.getDownloadURL().subscribe((url)=>{
            this.picture=url;
            this.toastr.success("Image successfully uploaded ")
        })
    })
  ).subscribe()
 

  }

}
