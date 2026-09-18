public class Developper extends User{
    private String programmingLanguage;
    public Developper(String name, String email, String programmingLanguage) {
        super(name, email);
        this.programmingLanguage = programmingLanguage;
    }
    public void displayDevelopperInfo(){
    System.out.println("Name: " + getName() +"\nEmail: " + getName() + "\nProgramming Lunguage" + programmingLanguage );
    }
    @Override
    public void displayRole(){System.out.println("developper");}
}
